'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, ProgressBar, Badge, Button, Form } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
    totalThreats: number
    activeThreats: number
    resolvedThreats: number
    criticalThreats: number
    totalCrises: number
    activeCrises: number
    avgRecoveryTime: number
    preparednessScore: number
    threatsByType: Record<string, number>
    threatsBySeverity: Record<string, number>
    monthlyTrends: Array<{
        month: string
        threats: number
        crises: number
    }>
}

interface Props {
    businessId: string
}

export default function AnalyticsDashboard({ businessId }: Props) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeframe, setTimeframe] = useState('30') // days

    useEffect(() => {
        loadAnalytics()
    }, [businessId, timeframe])

    const loadAnalytics = async () => {
        try {
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - parseInt(timeframe))

            // Load threats data
            const { data: threats } = await supabase
                .from('crisis_threats')
                .select('*')
                .eq('business_id', businessId)
                .gte('created_at', startDate.toISOString())

            // Load crises data
            const { data: crises } = await supabase
                .from('crisis_events')
                .select('*')
                .eq('business_id', businessId)
                .gte('started_at', startDate.toISOString())

            // Load recovery data
            const { data: recoveries } = await supabase
                .from('recovery_progress')
                .select('*')
                .eq('business_id', businessId)

            // Calculate analytics
            const threatsByType: Record<string, number> = {}
            const threatsBySeverity: Record<string, number> = {}

            threats?.forEach(threat => {
                threatsByType[threat.threat_type] = (threatsByType[threat.threat_type] || 0) + 1
                threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1
            })

            // Calculate average recovery time
            const completedRecoveries = recoveries?.filter(r => r.recovery_stage === 'complete') || []
            const avgRecoveryTime = completedRecoveries.length > 0
                ? completedRecoveries.reduce((sum, r) => {
                    const start = new Date(r.created_at)
                    const end = new Date(r.updated_at)
                    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) // days
                }, 0) / completedRecoveries.length
                : 0

            // Calculate preparedness score
            const hasEmergencyPlans = true // Assume from business profile
            const hasBackups = true // Assume from documents
            const threatResponse = (threats?.filter(t => t.status === 'resolved').length || 0) / Math.max(threats?.length || 1, 1)
            const preparednessScore = Math.round(
                (hasEmergencyPlans ? 30 : 0) +
                (hasBackups ? 30 : 0) +
                (threatResponse * 40)
            )

            // Generate monthly trends (simplified)
            const monthlyTrends = []
            for (let i = 5; i >= 0; i--) {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

                const monthThreats = threats?.filter(t => {
                    const created = new Date(t.created_at)
                    return created >= monthStart && created <= monthEnd
                }).length || 0

                const monthCrises = crises?.filter(c => {
                    const started = new Date(c.started_at)
                    return started >= monthStart && started <= monthEnd
                }).length || 0

                monthlyTrends.push({
                    month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    threats: monthThreats,
                    crises: monthCrises
                })
            }

            setAnalytics({
                totalThreats: threats?.length || 0,
                activeThreats: threats?.filter(t => t.status === 'active').length || 0,
                resolvedThreats: threats?.filter(t => t.status === 'resolved').length || 0,
                criticalThreats: threats?.filter(t => t.severity === 'critical').length || 0,
                totalCrises: crises?.length || 0,
                activeCrises: crises?.filter(c => c.status === 'active').length || 0,
                avgRecoveryTime: Math.round(avgRecoveryTime),
                preparednessScore,
                threatsByType,
                threatsBySeverity,
                monthlyTrends
            })
        } catch (error) {
            console.error('Failed to load analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'danger'
            case 'high': return 'warning'
            case 'moderate': return 'info'
            case 'low': return 'success'
            default: return 'secondary'
        }
    }

    const getPreparednessColor = (score: number) => {
        if (score >= 80) return 'success'
        if (score >= 60) return 'warning'
        return 'danger'
    }

    if (loading) return <Card><Card.Body>Loading analytics...</Card.Body></Card>
    if (!analytics) return <Card><Card.Body>No data available</Card.Body></Card>

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Business Analytics</h5>
                <Form.Select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    style={{ width: 'auto' }}
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </Form.Select>
            </div>

            {/* Key Metrics */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-primary">{analytics.totalThreats}</h3>
                            <small>Total Threats</small>
                            <div className="mt-1">
                                <Badge bg="warning">{analytics.activeThreats} Active</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-danger">{analytics.criticalThreats}</h3>
                            <small>Critical Threats</small>
                            <div className="mt-1">
                                <Badge bg="success">{analytics.resolvedThreats} Resolved</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-info">{analytics.totalCrises}</h3>
                            <small>Crisis Events</small>
                            <div className="mt-1">
                                <Badge bg="danger">{analytics.activeCrises} Active</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className={`text-${getPreparednessColor(analytics.preparednessScore)}`}>
                                {analytics.preparednessScore}%
                            </h3>
                            <small>Preparedness Score</small>
                            <ProgressBar
                                now={analytics.preparednessScore}
                                variant={getPreparednessColor(analytics.preparednessScore)}
                                className="mt-2"
                                size="sm"
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-4">
                {/* Threats by Type */}
                <Col md={6}>
                    <Card>
                        <Card.Header>Threats by Type</Card.Header>
                        <Card.Body>
                            {Object.keys(analytics.threatsByType).length === 0 ? (
                                <p className="text-muted">No threat data available</p>
                            ) : (
                                Object.entries(analytics.threatsByType).map(([type, count]) => (
                                    <div key={type} className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-capitalize">{type.replace('_', ' ')}</span>
                                        <Badge bg="secondary">{count}</Badge>
                                    </div>
                                ))
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Threats by Severity */}
                <Col md={6}>
                    <Card>
                        <Card.Header>Threats by Severity</Card.Header>
                        <Card.Body>
                            {Object.keys(analytics.threatsBySeverity).length === 0 ? (
                                <p className="text-muted">No severity data available</p>
                            ) : (
                                Object.entries(analytics.threatsBySeverity).map(([severity, count]) => (
                                    <div key={severity} className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-capitalize">{severity}</span>
                                        <Badge bg={getSeverityColor(severity)}>{count}</Badge>
                                    </div>
                                ))
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Monthly Trends */}
            <Card>
                <Card.Header>6-Month Trend</Card.Header>
                <Card.Body>
                    <Row>
                        {analytics.monthlyTrends.map((month, idx) => (
                            <Col key={idx} className="text-center">
                                <div className="mb-2">
                                    <small className="fw-bold">{month.month}</small>
                                </div>
                                <div className="mb-1">
                                    <Badge bg="primary">{month.threats}</Badge>
                                    <br />
                                    <small>Threats</small>
                                </div>
                                <div>
                                    <Badge bg="danger">{month.crises}</Badge>
                                    <br />
                                    <small>Crises</small>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            {analytics.avgRecoveryTime > 0 && (
                <Card className="mt-3">
                    <Card.Body className="text-center">
                        <h5>Average Recovery Time</h5>
                        <h3 className="text-info">{analytics.avgRecoveryTime} days</h3>
                        <small className="text-muted">Based on completed recovery processes</small>
                    </Card.Body>
                </Card>
            )}
        </div>
    )
}