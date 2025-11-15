'use client'

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Badge, ProgressBar } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import WeatherWidget from '@/components/WeatherWidget'
import WeatherAlerts from '@/components/WeatherAlerts'

export default function WeatherPage() {
    const { user } = useUser()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [weatherThreats, setWeatherThreats] = useState<any[]>([])

    useEffect(() => {
        async function load() {
            if (!user) return
            try {
                const { data: prof } = await supabase
                    .from('business_profiles')
                    .select('*')
                    .eq('clerk_id', user.id)
                    .single()

                setProfile(prof)

                if (prof?.id) {
                    // Load weather-related threats
                    const { data: threats } = await supabase
                        .from('crisis_threats')
                        .select('*')
                        .eq('business_id', prof.id)
                        .in('threat_type', ['flood', 'storm', 'heatwave', 'typhoon'])
                        .eq('status', 'active')
                        .order('probability', { ascending: false })

                    setWeatherThreats(threats || [])
                }
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [user])

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'danger'
            case 'high': return 'warning'
            case 'moderate': return 'info'
            case 'low': return 'success'
            default: return 'secondary'
        }
    }

    if (!user) return null

    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col className="d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="display-5">🌤️ Weather & Climate</h1>
                        <p className="text-muted">Real-time weather data and climate-related threats</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline-secondary">Back to Dashboard</Button>
                    </Link>
                </Col>
            </Row>

            {loading ? (
                <Card><Card.Body>Loading...</Card.Body></Card>
            ) : !profile ? (
                <Card><Card.Body>Profile not found</Card.Body></Card>
            ) : (
                <>
                    <Row>
                        {/* Weather Alerts */}
                        <Col md={8} className="mb-4">
                            <WeatherAlerts location={`${profile.city}, ${profile.country}`} />
                        </Col>

                        {/* Current Weather */}
                        <Col md={4} className="mb-4">
                            <WeatherWidget
                                location={`${profile.city}, ${profile.country}`}
                                showForecast={true}
                            />
                        </Col>
                    </Row>

                    {/* Weather-Related Threats */}
                    {weatherThreats.length > 0 && (
                        <Row className="mb-4">
                            <Col>
                                <Card className="shadow-sm">
                                    <Card.Header className="bg-warning text-dark">
                                        <h5 className="mb-0">⚠️ Active Weather Threats</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {weatherThreats.map((threat) => (
                                                <Col md={6} key={threat.id} className="mb-3">
                                                    <Card className="h-100">
                                                        <Card.Body>
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <h6>{threat.title}</h6>
                                                                <Badge bg={getSeverityColor(threat.severity)}>
                                                                    {threat.severity.toUpperCase()}
                                                                </Badge>
                                                            </div>

                                                            <p className="small text-muted mb-2">{threat.description}</p>

                                                            <div className="mb-2">
                                                                <small className="text-muted">Probability</small>
                                                                <ProgressBar
                                                                    now={threat.probability}
                                                                    label={`${threat.probability}%`}
                                                                    variant={threat.probability > 70 ? 'danger' : 'warning'}
                                                                />
                                                            </div>

                                                            {threat.predicted_date && (
                                                                <small className="text-muted">
                                                                    <strong>Expected:</strong> {new Date(threat.predicted_date).toLocaleDateString()}
                                                                </small>
                                                            )}
                                                        </Card.Body>
                                                        <Card.Footer>
                                                            <Link href={`/threats/${threat.id}`}>
                                                                <Button variant="outline-primary" size="sm">
                                                                    View Details
                                                                </Button>
                                                            </Link>
                                                        </Card.Footer>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}

                    {/* Weather Information */}
                    <Row>
                        <Col md={4} className="mb-4">
                            <Card className="shadow-sm h-100">
                                <Card.Header className="bg-info text-white">
                                    <h6 className="mb-0">🌊 Flood Risk</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="small">
                    Heavy rainfall (>50mm/day) can cause flooding in low-lying areas.
                                        Monitor weather forecasts and prepare evacuation routes.
                                    </p>
                                    <Link href="/plans/create">
                                        <Button variant="outline-info" size="sm" className="w-100">
                                            Create Flood Plan
                                        </Button>
                                    </Link>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4} className="mb-4">
                            <Card className="shadow-sm h-100">
                                <Card.Header className="bg-warning text-dark">
                                    <h6 className="mb-0">🌪️ Storm Risk</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="small">
                    Strong winds (>60 km/h) can damage structures and disrupt operations.
                                        Secure outdoor items and prepare backup power.
                                    </p>
                                    <Link href="/plans/create">
                                        <Button variant="outline-warning" size="sm" className="w-100">
                                            Create Storm Plan
                                        </Button>
                                    </Link>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4} className="mb-4">
                            <Card className="shadow-sm h-100">
                                <Card.Header className="bg-danger text-white">
                                    <h6 className="mb-0">🔥 Heat Risk</h6>
                                </Card.Header>
                                <Card.Body>
                                    <p className="small">
                    Extreme heat (>40°C) can affect health and operations.
                                        Ensure adequate cooling and hydration for staff.
                                    </p>
                                    <Link href="/plans/create">
                                        <Button variant="outline-danger" size="sm" className="w-100">
                                            Create Heat Plan
                                        </Button>
                                    </Link>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Weather Tips */}
                    <Row>
                        <Col>
                            <Card className="shadow-sm">
                                <Card.Header>
                                    <h5 className="mb-0">💡 Weather Preparedness Tips</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <h6>Before Severe Weather:</h6>
                                            <ul>
                                                <li>Monitor weather forecasts daily</li>
                                                <li>Prepare emergency supplies and equipment</li>
                                                <li>Secure outdoor items and signage</li>
                                                <li>Review and update emergency contacts</li>
                                                <li>Ensure backup power systems are functional</li>
                                            </ul>
                                        </Col>
                                        <Col md={6}>
                                            <h6>During Severe Weather:</h6>
                                            <ul>
                                                <li>Follow official warnings and advisories</li>
                                                <li>Evacuate if instructed by authorities</li>
                                                <li>Stay indoors and away from windows</li>
                                                <li>Keep emergency communication devices charged</li>
                                                <li>Document any damage for insurance claims</li>
                                            </ul>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    )
}
