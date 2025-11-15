import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { reportType = 'comprehensive', timeframe = '30', includeRecommendations = true } = await request.json()

        // Get business profile
        const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('clerk_id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
        }

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(timeframe))

        // Get threats data
        const { data: threats } = await supabase
            .from('crisis_threats')
            .select('*')
            .eq('business_id', profile.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('probability', { ascending: false })

        // Get crisis events
        const { data: crises } = await supabase
            .from('crisis_events')
            .select('*')
            .eq('business_id', profile.id)
            .gte('started_at', startDate.toISOString())
            .order('started_at', { ascending: false })

        // Generate report data
        const report = {
            id: `report_${Date.now()}`,
            generated_at: new Date().toISOString(),
            business_name: profile.business_name,
            report_type: reportType,
            timeframe_days: parseInt(timeframe),
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            summary: {
                total_threats: threats?.length || 0,
                active_threats: threats?.filter(t => t.status === 'active').length || 0,
                critical_threats: threats?.filter(t => t.severity === 'critical').length || 0,
                occurred_crises: crises?.filter(c => c.status === 'occurred').length || 0,
                avg_threat_probability: threats?.length ?
                    Math.round(threats.reduce((sum, t) => sum + (t.probability || 0), 0) / threats.length) : 0
            },
            threats_by_type: {},
            threats_by_severity: {},
            timeline: [],
            recommendations: []
        }

        // Analyze threats by type and severity
        if (threats) {
            const typeCount: Record<string, number> = {}
            const severityCount: Record<string, number> = {}

            threats.forEach(threat => {
                typeCount[threat.threat_type] = (typeCount[threat.threat_type] || 0) + 1
                severityCount[threat.severity] = (severityCount[threat.severity] || 0) + 1
            })

            report.threats_by_type = typeCount
            report.threats_by_severity = severityCount
        }

        // Create timeline
        const allEvents = [
            ...(threats || []).map(t => ({ ...t, event_type: 'threat', date: t.created_at })),
            ...(crises || []).map(c => ({ ...c, event_type: 'crisis', date: c.started_at }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        report.timeline = allEvents.slice(0, 20) // Last 20 events

        // Generate AI recommendations if requested
        if (includeRecommendations && threats?.length) {
            const highRiskThreats = threats.filter(t =>
                t.severity === 'critical' || t.severity === 'high' || t.probability > 70
            )

            report.recommendations = [
                `Review and update emergency plans for ${highRiskThreats.length} high-risk threats`,
                'Consider increasing insurance coverage for identified vulnerabilities',
                'Implement early warning systems for top threat categories',
                'Schedule quarterly threat assessment reviews',
                'Develop contingency plans for supply chain disruptions'
            ]

            if (report.summary.critical_threats > 0) {
                report.recommendations.unshift('URGENT: Address critical threats immediately')
            }
        }

        // Save report to database
        const { data: savedReport } = await supabase
            .from('threat_reports')
            .insert({
                business_id: profile.id,
                report_data: report,
                report_type: reportType,
                timeframe_days: parseInt(timeframe),
                generated_at: report.generated_at
            })
            .select()
            .single()

        return NextResponse.json({
            success: true,
            report,
            report_id: savedReport?.id
        })

    } catch (error) {
        console.error('Report generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}