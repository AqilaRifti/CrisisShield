'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap'

interface WeatherData {
    location: {
        name: string
        region: string
        country: string
    }
    current: {
        temp_c: number
        temp_f: number
        condition: {
            text: string
            code: number
        }
        wind_kph: number
        humidity: number
        precip_mm: number
        feelslike_c: number
    }
    forecast?: {
        forecastday: Array<{
            date: string
            day: {
                maxtemp_c: number
                mintemp_c: number
                condition: {
                    text: string
                    code: number
                }
                daily_chance_of_rain: number
                totalprecip_mm: number
            }
        }>
    }
}

interface Props {
    location: string
    showForecast?: boolean
}

export default function WeatherWidget({ location, showForecast = true }: Props) {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadWeather()
    }, [location])

    const loadWeather = async () => {
        try {
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}&forecast=${showForecast}`)
            if (!response.ok) throw new Error('Failed to fetch weather')
            const data = await response.json()
            setWeather(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const getWeatherIcon = (code: number) => {
        // Weather condition codes from WeatherAPI.com
        if (code === 1000) return '☀️' // Sunny
        if ([1003, 1006, 1009].includes(code)) return '☁️' // Cloudy
        if ([1063, 1180, 1183, 1186, 1189, 1192, 1195].includes(code)) return '🌧️' // Rain
        if ([1066, 1210, 1213, 1216, 1219, 1222, 1225].includes(code)) return '❄️' // Snow
        if ([1087, 1273, 1276].includes(code)) return '⛈️' // Thunderstorm
        if ([1030, 1135, 1147].includes(code)) return '🌫️' // Fog
        return '🌤️' // Default
    }

    const getWindDirection = (kph: number) => {
        if (kph < 10) return 'Light'
        if (kph < 30) return 'Moderate'
        if (kph < 60) return 'Strong'
        return 'Very Strong'
    }

    const getRainChanceColor = (chance: number) => {
        if (chance >= 70) return 'danger'
        if (chance >= 40) return 'warning'
        return 'info'
    }

    if (loading) {
        return (
            <Card>
                <Card.Body className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 mb-0 text-muted">Loading weather...</p>
                </Card.Body>
            </Card>
        )
    }

    if (error || !weather) {
        return (
            <Card>
                <Card.Body>
                    <Alert variant="warning" className="mb-0">
                        <small>Weather data unavailable</small>
                    </Alert>
                </Card.Body>
            </Card>
        )
    }

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-0">🌤️ Weather Conditions</h6>
                        <small>{weather.location.name}, {weather.location.country}</small>
                    </div>
                    <div className="text-end">
                        <div style={{ fontSize: '2rem' }}>
                            {getWeatherIcon(weather.current.condition.code)}
                        </div>
                    </div>
                </div>
            </Card.Header>

            <Card.Body>
                {/* Current Weather */}
                <Row className="mb-3">
                    <Col xs={6}>
                        <div className="text-center">
                            <h2 className="mb-0">{Math.round(weather.current.temp_c)}°C</h2>
                            <small className="text-muted">{weather.current.condition.text}</small>
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className="text-center">
                            <h2 className="mb-0">{Math.round(weather.current.feelslike_c)}°C</h2>
                            <small className="text-muted">Feels like</small>
                        </div>
                    </Col>
                </Row>

                {/* Weather Details */}
                <Row className="g-2 mb-3">
                    <Col xs={6}>
                        <div className="p-2 bg-light rounded">
                            <small className="text-muted d-block">💨 Wind</small>
                            <strong>{Math.round(weather.current.wind_kph)} km/h</strong>
                            <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>
                                {getWindDirection(weather.current.wind_kph)}
                            </Badge>
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className="p-2 bg-light rounded">
                            <small className="text-muted d-block">💧 Humidity</small>
                            <strong>{weather.current.humidity}%</strong>
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className="p-2 bg-light rounded">
                            <small className="text-muted d-block">🌧️ Precipitation</small>
                            <strong>{weather.current.precip_mm} mm</strong>
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className="p-2 bg-light rounded">
                            <small className="text-muted d-block">🌡️ Temperature</small>
                            <strong>{Math.round(weather.current.temp_f)}°F</strong>
                        </div>
                    </Col>
                </Row>

                {/* 3-Day Forecast */}
                {showForecast && weather.forecast && (
                    <div>
                        <hr />
                        <h6 className="mb-3">3-Day Forecast</h6>
                        <Row className="g-2">
                            {weather.forecast.forecastday.slice(0, 3).map((day, idx) => (
                                <Col key={idx} xs={4}>
                                    <div className="text-center p-2 bg-light rounded">
                                        <small className="text-muted d-block">
                                            {idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </small>
                                        <div style={{ fontSize: '1.5rem' }}>
                                            {getWeatherIcon(day.day.condition.code)}
                                        </div>
                                        <div>
                                            <strong>{Math.round(day.day.maxtemp_c)}°</strong>
                                            <span className="text-muted"> / {Math.round(day.day.mintemp_c)}°</span>
                                        </div>
                                        {day.day.daily_chance_of_rain > 0 && (
                                            <Badge bg={getRainChanceColor(day.day.daily_chance_of_rain)} className="mt-1" style={{ fontSize: '0.65rem' }}>
                                                {day.day.daily_chance_of_rain}% rain
                                            </Badge>
                                        )}
                                        {day.day.totalprecip_mm > 10 && (
                                            <div className="mt-1">
                                                <small className="text-danger">⚠️ {Math.round(day.day.totalprecip_mm)}mm</small>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
            </Card.Body>
        </Card>
    )
}
