// WeatherAPI.com integration for weather data and forecasts
// Docs: https://www.weatherapi.com/docs/

interface WeatherData {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
  }
  current: {
    temp_c: number
    temp_f: number
    condition: {
      text: string
      code: number
    }
    wind_kph: number
    wind_mph: number
    humidity: number
    precip_mm: number
    feelslike_c: number
    feelslike_f: number
  }
}

interface ForecastData {
  location: {
    name: string
    region: string
    country: string
  }
  forecast: {
    forecastday: Array<{
      date: string
      day: {
        maxtemp_c: number
        mintemp_c: number
        avgtemp_c: number
        maxwind_kph: number
        totalprecip_mm: number
        avghumidity: number
        daily_chance_of_rain: number
        condition: {
          text: string
          code: number
        }
      }
      hour: Array<{
        time: string
        temp_c: number
        condition: {
          text: string
          code: number
        }
        wind_kph: number
        precip_mm: number
        humidity: number
        chance_of_rain: number
      }>
    }>
  }
}

interface WeatherAlert {
  headline: string
  severity: string
  urgency: string
  areas: string
  category: string
  certainty: string
  event: string
  effective: string
  expires: string
  desc: string
  instruction: string
}

const WEATHER_API_KEY = process.env.WEATHER_API_KEY
const BASE_URL = 'https://api.weatherapi.com/v1'

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(location: string): Promise<WeatherData | null> {
  if (!WEATHER_API_KEY) {
    console.warn('WEATHER_API_KEY not configured')
    return null
  }

  try {
    const response = await fetch(
      `${BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`
    )

    if (!response.ok) {
      console.error('Weather API error:', response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching current weather:', error)
    return null
  }
}

/**
 * Get weather forecast for a location (up to 14 days)
 */
export async function getWeatherForecast(
  location: string,
  days: number = 7
): Promise<ForecastData | null> {
  if (!WEATHER_API_KEY) {
    console.warn('WEATHER_API_KEY not configured')
    return null
  }

  // Limit to 14 days (API limit)
  const forecastDays = Math.min(days, 14)

  try {
    const response = await fetch(
      `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=${forecastDays}&aqi=no&alerts=yes`
    )

    if (!response.ok) {
      console.error('Weather API error:', response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    return null
  }
}

/**
 * Get weather alerts for a location
 */
export async function getWeatherAlerts(location: string): Promise<WeatherAlert[] | null> {
  if (!WEATHER_API_KEY) {
    console.warn('WEATHER_API_KEY not configured')
    return null
  }

  try {
    const response = await fetch(
      `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=1&aqi=no&alerts=yes`
    )

    if (!response.ok) {
      console.error('Weather API error:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.alerts?.alert || []
  } catch (error) {
    console.error('Error fetching weather alerts:', error)
    return null
  }
}

/**
 * Analyze weather data for potential threats
 */
export function analyzeWeatherThreats(forecast: ForecastData): Array<{
  type: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  description: string
  date: string
  probability: number
}> {
  const threats: Array<{
    type: string
    severity: 'low' | 'moderate' | 'high' | 'critical'
    description: string
    date: string
    probability: number
  }> = []

  if (!forecast?.forecast?.forecastday) return threats

  forecast.forecast.forecastday.forEach((day) => {
    // Heavy rain threat
    if (day.day.totalprecip_mm > 50) {
      threats.push({
        type: 'flood',
        severity: day.day.totalprecip_mm > 100 ? 'critical' : 'high',
        description: `Heavy rainfall expected: ${day.day.totalprecip_mm}mm. Flood risk.`,
        date: day.date,
        probability: day.day.daily_chance_of_rain
      })
    }

    // Strong wind threat
    if (day.day.maxwind_kph > 60) {
      threats.push({
        type: 'storm',
        severity: day.day.maxwind_kph > 100 ? 'critical' : 'high',
        description: `Strong winds expected: ${day.day.maxwind_kph} km/h. Storm risk.`,
        date: day.date,
        probability: 80
      })
    }

    // Extreme temperature
    if (day.day.maxtemp_c > 40) {
      threats.push({
        type: 'heatwave',
        severity: day.day.maxtemp_c > 45 ? 'high' : 'moderate',
        description: `Extreme heat expected: ${day.day.maxtemp_c}°C. Heat stress risk.`,
        date: day.date,
        probability: 90
      })
    }

    // Check hourly data for severe conditions
    const severeHours = day.hour.filter(
      (hour) => hour.chance_of_rain > 80 && hour.precip_mm > 10
    )
    if (severeHours.length > 6) {
      threats.push({
        type: 'flood',
        severity: 'high',
        description: `Prolonged heavy rain expected. Extended flood risk.`,
        date: day.date,
        probability: 85
      })
    }
  })

  return threats
}

/**
 * Get weather-based threat assessment for a business location
 */
export async function getWeatherThreatAssessment(location: string): Promise<{
  current: WeatherData | null
  forecast: ForecastData | null
  alerts: WeatherAlert[] | null
  threats: Array<{
    type: string
    severity: 'low' | 'moderate' | 'high' | 'critical'
    description: string
    date: string
    probability: number
  }>
}> {
  const [current, forecast, alerts] = await Promise.all([
    getCurrentWeather(location),
    getWeatherForecast(location, 7),
    getWeatherAlerts(location)
  ])

  const threats = forecast ? analyzeWeatherThreats(forecast) : []

  return {
    current,
    forecast,
    alerts,
    threats
  }
}

/**
 * Format location string from business profile
 */
export function formatLocationString(city: string, country: string): string {
  return `${city}, ${country}`
}
