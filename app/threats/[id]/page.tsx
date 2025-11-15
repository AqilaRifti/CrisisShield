"use client"

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Badge, Alert } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'danger'
    case 'high': return 'warning'
    case 'moderate': return 'info'
    case 'low': return 'success'
    default: return 'secondary'
  }
}

export default function ThreatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [threat, setThreat] = useState<any>(null)
  const [authorized, setAuthorized] = useState(true)
  const [threatId, setThreatId] = useState<string>('')

  useEffect(() => {
    params.then(p => setThreatId(p.id))
  }, [params])

  useEffect(() => {
    async function load() {
      if (!user || !threatId) return
      try {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        const { data: th } = await supabase
          .from('crisis_threats')
          .select('*')
          .eq('id', threatId)
          .single()

        if (th && profile && th.business_id !== profile.id) {
          setAuthorized(false)
        } else {
          setThreat(th)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, threatId])

  if (!user) return null
  if (loading) return <Container className="py-5"><Card><Card.Body>Loading...</Card.Body></Card></Container>
  if (!authorized) return <Container className="py-5"><Alert variant="danger">Unauthorized access</Alert></Container>

  const recommendations = threat?.ai_analysis ? JSON.parse(threat.ai_analysis) : []

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className={`bg-${getSeverityColor(threat?.severity)} text-white`}>
              <h4 className="mb-0">{threat?.title}</h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Badge bg={getSeverityColor(threat?.severity)} className="me-2">
                  {threat?.severity?.toUpperCase()}
                </Badge>
                <Badge bg="secondary">
                  {threat?.probability}% Probability
                </Badge>
              </div>

              <p className="lead">{threat?.description}</p>

              {threat?.predicted_date && (
                <p><strong>Predicted Date:</strong> {new Date(threat?.predicted_date).toLocaleDateString()}</p>
              )}

              {threat?.affected_radius_km && (
                <p><strong>Affected Radius:</strong> {threat?.affected_radius_km} km</p>
              )}

              {recommendations.length > 0 && (
                <div className="mt-4">
                  <h5>AI Recommendations</h5>
                  <ul>
                    {recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <Link href="/plans/create">
                  <button className="btn btn-primary">Create Emergency Plan</button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">Threat Details</h6>
            </Card.Header>
            <Card.Body>
              <p><strong>Type:</strong> {threat?.threat_type}</p>
              <p><strong>Status:</strong> <Badge bg="info">{threat?.status}</Badge></p>
              <p><strong>Detected:</strong> {threat?.created_at ? new Date(threat.created_at).toLocaleDateString() : ''}</p>
              <p><strong>Last Updated:</strong> {threat?.updated_at ? new Date(threat.updated_at).toLocaleDateString() : ''}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

