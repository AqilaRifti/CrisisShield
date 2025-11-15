'use client'

import { useEffect, useMemo, useState } from 'react'
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ThreatReportGenerator from '@/components/ThreatReportGenerator'

function severityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'danger'
    case 'high': return 'warning'
    case 'moderate': return 'info'
    case 'low': return 'success'
    default: return 'secondary'
  }
}

export default function ThreatsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [threats, setThreats] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('active')
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      try {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        if (profile?.id) {
          const { data } = await supabase
            .from('crisis_threats')
            .select('*')
            .eq('business_id', profile.id)
            .order('created_at', { ascending: false })
          setThreats(data || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const filtered = useMemo(() => {
    return threats.filter(t => {
      const statusOk = statusFilter === 'all' ? true : t.status === statusFilter
      const q = query.trim().toLowerCase()
      const qOk = !q || `${t.title} ${t.description} ${t.threat_type}`.toLowerCase().includes(q)
      return statusOk && qOk
    })
  }, [threats, statusFilter, query])

  const updateStatus = async (id: string, status: string) => {
    setThreats(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await fetch(`/api/threats/${id}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
  }

  if (!user) return null

  return (
    <Container fluid className="py-4">
      <Row className="mb-3 align-items-center" role="region" aria-label="Threats filters">
        <Col md={6} className="mb-2">
          <InputGroup>
            <InputGroup.Text id="search-label">Search</InputGroup.Text>
            <Form.Control
              aria-labelledby="search-label"
              placeholder="Filter by title, type, description"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3} className="mb-2">
          <Form.Select aria-label="Threat status filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="active">Active</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
            <option value="occurred">Occurred</option>
            <option value="all">All</option>
          </Form.Select>
        </Col>
        <Col md={3} className="text-end mb-2">
          <div className="d-flex gap-2 justify-content-end">
            <ThreatReportGenerator />
            <Link href="/dashboard">
              <Button variant="outline-secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </Col>
      </Row>

      {loading ? (
        <Card><Card.Body>Loading...</Card.Body></Card>
      ) : filtered.length === 0 ? (
        <Card role="status" aria-live="polite"><Card.Body>No threats found.</Card.Body></Card>
      ) : (
        <Row as="ul" className="list-unstyled" role="list">
          {filtered.map((t) => (
            <Col as="li" md={6} key={t.id} className="mb-3" role="listitem">
              <Card className="h-100 shadow-sm" aria-labelledby={`threat-${t.id}-title`}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 id={`threat-${t.id}-title`} className="mb-1">{t.title}</h5>
                    <div className="d-flex gap-2 align-items-center">
                      <Badge bg={severityColor(t.severity)} aria-label={`Severity ${t.severity}`}>{t.severity.toUpperCase()}</Badge>
                      <Badge bg="secondary" aria-label={`Probability ${t.probability} percent`}>{t.probability}%</Badge>
                      <Badge bg="light" text="dark">{t.threat_type}</Badge>
                    </div>
                  </div>
                  <div className="text-end small text-muted">
                    {t.predicted_date && new Date(t.predicted_date).toLocaleDateString()}
                  </div>
                </Card.Header>
                <Card.Body>
                  <p className="mb-2">{t.description}</p>
                  {t.ai_analysis && (
                    <details>
                      <summary>Recommendations</summary>
                      <ul className="mt-2">
                        {(() => { try { return JSON.parse(t.ai_analysis) as string[] } catch { return [] } })().map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </Card.Body>
                <Card.Footer className="d-flex flex-wrap gap-2">
                  <Link href={`/threats/${t.id}`}>
                    <Button variant="outline-primary" size="sm" aria-label={`View details for ${t.title}`}>View Details</Button>
                  </Link>
                  <Button variant="outline-success" size="sm" onClick={() => updateStatus(t.id, 'monitoring')} aria-label={`Mark ${t.title} as monitoring`}>Monitoring</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => updateStatus(t.id, 'resolved')} aria-label={`Mark ${t.title} as resolved`}>Resolve</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => updateStatus(t.id, 'occurred')} aria-label={`Mark ${t.title} as occurred`}>Occurred</Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  )
}


