import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWeather, getWeatherForecast } from '@/lib/external-apis/weather'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const location = searchParams.get('location')
        const includeForecast = searchParams.get('forecast') === 'true'

        if (!location) {
            return NextResponse.json({ error: 'Location is required' }, { status: 400 })
        }

        if (includeForecast) {
            const forecast = await getWeatherForecast(location, 3)
            if (!forecast) {
                return NextResponse.json({ error: 'Weather data unavailable' }, { status: 503 })
            }
            return NextResponse.json(forecast)
        } else {
            const current = await getCurrentWeather(location)
            if (!current) {
                return NextResponse.json({ error: 'Weather data unavailable' }, { status: 503 })
            }
            return NextResponse.json(current)
        }
    } catch (error) {
        console.error('Weather API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch weather data' },
            { status: 500 }
        )
    }
}
