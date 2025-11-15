export interface WeatherData {
  current: {
    temp: number
    humidity: number
    pressure: number
    weather: string
  }
  forecast: {
    date: string
    temp_max: number
    temp_min: number
    precipitation_probability: number
    weather: string
  }[]
  alerts: {
    event: string
    severity: string
    description: string
    start: string
    end: string
  }[]
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY!
  
  try {
    // Get current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )
    const current = await currentRes.json()
    
    // Get 5-day forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 300 } }
    )
    const forecast = await forecastRes.json()
    
    // Get weather alerts (onecall API)
    let alerts: any[] = []
    try {
      const alertsRes = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${apiKey}`,
        { next: { revalidate: 300 } }
      )
      const alertsData = await alertsRes.json()
      alerts = alertsData.alerts || []
    } catch (e) {
      // Alerts API might not be available in free tier
      console.warn('Weather alerts API not available')
    }
    
    return {
      current: {
        temp: current.main.temp,
        humidity: current.main.humidity,
        pressure: current.main.pressure,
        weather: current.weather[0].description
      },
      forecast: forecast.list.slice(0, 5).map((item: any) => ({
        date: item.dt_txt.split(' ')[0],
        temp_max: item.main.temp_max,
        temp_min: item.main.temp_min,
        precipitation_probability: (item.pop || 0) * 100,
        weather: item.weather[0].description
      })),
      alerts: alerts.map((alert: any) => ({
        event: alert.event,
        severity: alert.severity,
        description: alert.description,
        start: new Date(alert.start * 1000).toISOString(),
        end: new Date(alert.end * 1000).toISOString()
      }))
    }
  } catch (error) {
    console.error('Error fetching weather data:', error)
    throw error
  }
}

