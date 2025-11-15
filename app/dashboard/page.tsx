"use client"

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ThreatReportGenerator from '@/components/ThreatReportGenerator'
import RecoveryDashboard from '@/components/RecoveryDashboard'
import CrisisManagement from '@/components/CrisisManagement'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import EmergencyPlanManager from '@/components/EmergencyPlanManager'
import WeatherWidget from '@/components/WeatherWidget'
import WeatherAlerts from '@/components/WeatherAlerts'

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'danger'
    case 'high': return 'warning'
    case 'moderate': return 'info'
    case 'low': return 'success'
    default: return 'secondary'
  }
}

export default function DashboardPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [threats, setThreats] = useState<any[]>([])
  const [activeCrises, setActiveCrises] = useState<any[]>([])

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
          const [{ data: th = [] }, { data: crises = [] }] = await Promise.all([
            supabase
              .from('crisis_threats')
              .select('*')
              .eq('business_id', prof.id)
              .eq('status', 'active')
              .order('probability', { ascending: false })
              .limit(5),
            supabase
              .from('crisis_events')
              .select('*')
              .eq('business_id', prof.id)
              .eq('status', 'active')
              .order('started_at', { ascending: false })
          ])

          setThreats(th || [])
          setActiveCrises(crises || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (!user) return null

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5">Dashboard</h1>
          <p className="text-muted">Welcome back, {profile?.business_name || ''}</p>
        </Col>
      </Row>

      {activeCrises.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Active Crisis Alert</Alert.Heading>
              <p>{activeCrises[0]?.title}</p>
              <Link href={`/crisis/active/${activeCrises[0]?.id}`}>
                <Button variant="danger">Get Guidance Now</Button>
              </Link>
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">Active Threats</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p className="text-muted">Loading...</p>
              ) : threats.length === 0 ? (
                <p className="text-muted">No active threats detected. Your business is safe!</p>
              ) : (
                threats.map((threat) => (
                  <Card key={threat.id} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6>{threat.title}</h6>
                          <p className="text-muted small mb-2">{threat.description}</p>
                          <div className="d-flex gap-2">
                            <Badge bg={getSeverityColor(threat.severity)}>
                              {threat.severity.toUpperCase()}
                            </Badge>
                            <Badge bg="secondary">
                              {threat.probability}% Probability
                            </Badge>
                            {threat.predicted_date && (
                              <Badge bg="info">
                                {new Date(threat.predicted_date).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Link href={`/threats/${threat.id}`}>
                          <Button variant="outline-primary" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
              <div className="text-end">
                <Link href="/threats">
                  <Button variant="link" className="p-0">View all threats</Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* Weather Alerts */}
          {profile?.city && profile?.country && (
            <div className="mb-4">
              <WeatherAlerts location={`${profile.city}, ${profile.country}`} />
            </div>
          )}

          {/* Weather Widget */}
          {profile?.city && profile?.country && (
            <div className="mb-4">
              <WeatherWidget
                location={`${profile.city}, ${profile.country}`}
                showForecast={true}
              />
            </div>
          )}

          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Link href="/plans/create">
                <Button variant="primary" className="w-100 mb-2">
                  Create Emergency Plan
                </Button>
              </Link>
              <Link href="/documents/backup">
                <Button variant="outline-primary" className="w-100 mb-2">
                  Backup Documents
                </Button>
              </Link>
              <Link href="/funding">
                <Button variant="outline-success" className="w-100 mb-2">
                  Find Funding
                </Button>
              </Link>
              <div className="w-100 mb-2">
                <ThreatReportGenerator />
              </div>
              <Link href="/help">
                <Button variant="outline-info" className="w-100 mb-2">
                  Help & Support
                </Button>
              </Link>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Business Health Score</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <h2 className="display-4 text-success">85</h2>
                <p className="text-muted">Good</p>
                <small className="text-muted">
                  Based on preparedness level, insurance status, and backup completion
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Crisis Management Section */}
      {profile?.id && (
        <Row className="mt-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-danger text-white">
                <h5 className="mb-0">Crisis Management</h5>
              </Card.Header>
              <Card.Body>
                <CrisisManagement
                  businessId={profile.id}
                  onCrisisUpdate={() => window.location.reload()}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Recovery Dashboard Section */}
      {profile?.id && (
        <Row className="mt-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">Recovery Progress</h5>
              </Card.Header>
              <Card.Body>
                <RecoveryDashboard
                  businessId={profile.id}
                  onUpdate={() => window.location.reload()}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Emergency Plans Section */}
      {profile?.id && (
        <Row className="mt-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Emergency Plans</h5>
              </Card.Header>
              <Card.Body>
                <EmergencyPlanManager
                  businessId={profile.id}
                  onPlanUpdate={() => window.location.reload()}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Analytics Dashboard Section */}
      {profile?.id && (
        <Row className="mt-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">Business Analytics</h5>
              </Card.Header>
              <Card.Body>
                <AnalyticsDashboard businessId={profile.id} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  )
}

