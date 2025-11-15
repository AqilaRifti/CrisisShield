import { NextRequest, NextResponse } from 'next/server'
import { getWeatherAlerts } from '@/lib/external-apis/weather'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const location = searchParams.get('location')

        if (!location) {
            return NextResponse.json({ error: 'Location is required' }, { status: 400 })
        }

        const alerts = await getWeatherAlerts(location)

        return NextResponse.json({
            alerts: alerts || [],
            count: alerts?.length || 0
        })
    } catch (error) {
        console.error('Weather alerts API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch weather alerts' },
            { status: 500 }
        )
    }
}
