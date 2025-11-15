"use client"

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap'
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

export default function PlansPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        if (profile?.id) {
          const { data } = await supabase
            .from('emergency_plans')
            .select('*')
            .eq('business_id', profile.id)
            .order('created_at', { ascending: false })

          setPlans(data || [])
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
        <Col className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-5">Emergency Plans</h1>
            <p className="text-muted">Your crisis response plans</p>
          </div>
          <Link href="/plans/create">
            <Button variant="primary">Create New Plan</Button>
          </Link>
        </Col>
      </Row>

      {loading ? (
        <Card><Card.Body>Loading...</Card.Body></Card>
      ) : plans.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-4">You don't have any emergency plans yet.</p>
            <Link href="/plans/create">
              <Button variant="primary">Create Your First Plan</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {plans.map((plan) => (
            <Col md={6} key={plan.id} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{plan.plan_name}</h5>
                  <Badge bg={getStatusColor(plan.status)}>
                    {plan.status.toUpperCase()}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <p><strong>Type:</strong> {plan.plan_type}</p>
                  {plan.estimated_cost && (
                    <p><strong>Estimated Cost:</strong> ${plan.estimated_cost.toLocaleString()}</p>
                  )}
                  {plan.last_reviewed_at && (
                    <p><strong>Last Reviewed:</strong> {new Date(plan.last_reviewed_at).toLocaleDateString()}</p>
                  )}
                  <p className="text-muted small">
                    Created: {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Link href={`/plans/${plan.id}`}>
                    <Button variant="outline-primary" size="sm" className="me-2">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/plans/${plan.id}/edit`}>
                    <Button variant="outline-secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  )
}

