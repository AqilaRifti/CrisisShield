'use client'

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, ProgressBar, Badge, Button, Form, Alert } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export default function RecoveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recovery, setRecovery] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [stage, setStage] = useState('assessment')
  const [operational, setOperational] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [milestoneText, setMilestoneText] = useState('')
  const [recoveryId, setRecoveryId] = useState<string>('')

  useEffect(() => {
    params.then(p => setRecoveryId(p.id))
  }, [params])

  useEffect(() => {
    async function load() {
      if (!user || !recoveryId) return
      try {
        const { data: rec } = await supabase
          .from('recovery_progress')
          .select('*, crisis_events(*), crisis_event_id')
          .eq('id', recoveryId)
          .single()
        setRecovery(rec)
        if (rec) {
          setStage(rec.recovery_stage || 'assessment')
          setOperational(rec.operational_capacity_percent || 0)
          setRevenue(rec.revenue_recovery_percent || 0)
        }

        if (rec?.crisis_events?.emergency_plan_id) {
          const { data: planData } = await supabase
            .from('emergency_plans')
            .select('*')
            .eq('id', rec.crisis_events.emergency_plan_id)
            .single()
          setPlan(planData)
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, recoveryId])

  const updateRecovery = async () => {
    if (!recovery) return
    const res = await fetch(`/api/recovery/${recovery.id}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recovery_stage: stage,
        operational_capacity_percent: operational,
        revenue_recovery_percent: revenue
      })
    })
    if (!res.ok) setError('Failed to update')
  }

  const addMilestone = async () => {
    if (!recovery || !milestoneText.trim()) return
    const milestones = [...(recovery.milestones_completed || []), { milestone: milestoneText, completed_at: new Date().toISOString() }]
    const res = await fetch(`/api/recovery/${recovery.id}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestones_completed: milestones })
    })
    if (res.ok) {
      setRecovery({ ...recovery, milestones_completed: milestones })
      setMilestoneText('')
    }
  }

  const toggleAction = async (phase: 'pre' | 'during' | 'post', index: number, completed: boolean) => {
    if (!plan) return
    const res = await fetch('/api/plans/action/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id, phase, index, completed })
    })
    if (res.ok) {
      const updated = await res.json()
      setPlan(updated.plan)
    }
  }

  if (!user) return null
  if (loading) return <Container className="py-5"><Card><Card.Body>Loading...</Card.Body></Card></Container>
  if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-6">Recovery Detail</h1>
          <p className="text-muted">Crisis: {recovery?.crisis_events?.title}</p>
        </Col>
      </Row>

      <Row>
        <Col md={7}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h6 className="mb-0">Recovery Metrics</h6>
            </Card.Header>
            <Card.Body>
              <Form className="mb-3">
                <Form.Group className="mb-3">
                  <Form.Label>Recovery Stage</Form.Label>
                  <Form.Select value={stage} onChange={e => setStage(e.target.value)}>
                    <option value="assessment">Assessment</option>
                    <option value="cleanup">Cleanup</option>
                    <option value="rebuilding">Rebuilding</option>
                    <option value="reopening">Reopening</option>
                    <option value="stabilization">Stabilization</option>
                    <option value="complete">Complete</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Operational Capacity: {operational}%</Form.Label>
                  <Form.Range value={operational} onChange={e => setOperational(parseInt(e.target.value))} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Revenue Recovery: {revenue}%</Form.Label>
                  <Form.Range value={revenue} onChange={e => setRevenue(parseInt(e.target.value))} />
                </Form.Group>
                <Button variant="primary" onClick={updateRecovery}>Save Metrics</Button>
              </Form>

              <div className="mb-3">
                <p className="mb-1"><strong>Operational Capacity</strong></p>
                <ProgressBar now={operational} label={`${operational}%`} variant="primary" className="mb-2" />
                <p className="mb-1"><strong>Revenue Recovery</strong></p>
                <ProgressBar now={revenue} label={`${revenue}%`} variant="success" />
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">Milestones</h6>
            </Card.Header>
            <Card.Body>
              <ul>
                {(recovery?.milestones_completed || []).map((m: any, idx: number) => (
                  <li key={idx}>{m.milestone} <small className="text-muted">({new Date(m.completed_at).toLocaleString()})</small></li>
                ))}
              </ul>
              <div className="d-flex gap-2">
                <Form.Control value={milestoneText} onChange={e => setMilestoneText(e.target.value)} placeholder="Add milestone" />
                <Button variant="outline-primary" onClick={addMilestone}>Add</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h6 className="mb-0">Next Actions</h6>
            </Card.Header>
            <Card.Body>
              {(recovery?.next_actions || []).length === 0 ? (
                <p className="text-muted">No next actions. Complete plan steps below.</p>
              ) : (
                <ul>
                  {recovery.next_actions.map((a: string, idx: number) => (<li key={idx}>{a}</li>))}
                </ul>
              )}
            </Card.Body>
          </Card>

          {plan && (
            <Card className="shadow-sm">
              <Card.Header>
                <h6 className="mb-0">Emergency Plan: {plan.plan_name}</h6>
              </Card.Header>
              <Card.Body>
                <h6 className="mt-2">During Crisis</h6>
                <ul className="list-unstyled">
                  {(plan.during_crisis_actions || []).map((a: any, idx: number) => (
                    <li key={`during-${idx}`} className="mb-2">
                      <Form.Check
                        type="checkbox"
                        checked={!!a.completed}
                        onChange={(e) => toggleAction('during', idx, e.target.checked)}
                        label={a.action}
                      />
                    </li>
                  ))}
                </ul>
                <h6 className="mt-3">Post-Crisis</h6>
                <ul className="list-unstyled">
                  {(plan.post_crisis_actions || []).map((a: any, idx: number) => (
                    <li key={`post-${idx}`} className="mb-2">
                      <Form.Check
                        type="checkbox"
                        checked={!!a.completed}
                        onChange={(e) => toggleAction('post', idx, e.target.checked)}
                        label={a.action}
                      />
                    </li>
                  ))}
                </ul>
                <h6 className="mt-3">Pre-Crisis</h6>
                <ul className="list-unstyled">
                  {(plan.pre_crisis_actions || []).map((a: any, idx: number) => (
                    <li key={`pre-${idx}`} className="mb-2">
                      <Form.Check
                        type="checkbox"
                        checked={!!a.completed}
                        onChange={(e) => toggleAction('pre', idx, e.target.checked)}
                        label={a.action}
                      />
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  )
}


