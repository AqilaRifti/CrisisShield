'use client'

import { useEffect, useState, use } from 'react'
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'success'
    case 'in_use': return 'warning'
    case 'draft': return 'secondary'
    case 'archived': return 'dark'
    default: return 'secondary'
  }
}

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<any>(null)
  const [error, setError] = useState('')
  const { id } = use(params)

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const { data } = await supabase
          .from('emergency_plans')
          .select('*')
          .eq('id', id)
          .single()
        setPlan(data)
      } catch (e: any) {
        setError(e.message || 'Failed to load plan')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, id])

  if (!user) return null
  if (loading) return <Container className="py-5"><Card><Card.Body>Loading...</Card.Body></Card></Container>
  if (error) return <Container className="py-5"><Card><Card.Body>{error}</Card.Body></Card></Container>
  if (!plan) return <Container className="py-5"><Card><Card.Body>Plan not found</Card.Body></Card></Container>

  const section = (title: string, actions: any[]) => (
    <Card className="mb-3">
      <Card.Header><strong>{title}</strong></Card.Header>
      <Card.Body>
        {(!actions || actions.length === 0) ? (
          <p className="text-muted">No actions.</p>
        ) : (
          <ul>
            {actions.map((a: any, idx: number) => (
              <li key={idx}>
                <strong>{a.priority || 'medium'}:</strong> {a.action}
                {a.estimated_cost ? ` (Cost: $${a.estimated_cost})` : ''}
                {a.time_required ? ` • ${a.time_required}` : ''}
                {a.responsible_party ? ` • ${a.responsible_party}` : ''}
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  )

  return (
    <Container fluid className="py-4">
      <Row className="mb-3">
        <Col className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1">{plan.plan_name}</h2>
            <div className="d-flex gap-2 align-items-center">
              <Badge bg="info">{plan.plan_type}</Badge>
              <Badge bg={getStatusColor(plan.status)}>{plan.status?.toUpperCase()}</Badge>
            </div>
          </div>
          <Link href={`/plans/${plan.id}/edit`}>
            <Button variant="primary">Edit Plan</Button>
          </Link>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          {section('During Crisis', plan.during_crisis_actions || [])}
          {section('Post-Crisis Recovery', plan.post_crisis_actions || [])}
          {section('Pre-Crisis Preparation', plan.pre_crisis_actions || [])}
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header><strong>Details</strong></Card.Header>
            <Card.Body>
              {plan.estimated_cost && (
                <p><strong>Estimated Total Cost:</strong> ${plan.estimated_cost.toLocaleString()}</p>
              )}
              <p><strong>Created:</strong> {new Date(plan.created_at).toLocaleDateString()}</p>
              <p><strong>Updated:</strong> {new Date(plan.updated_at).toLocaleDateString()}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}


