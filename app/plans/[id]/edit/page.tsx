'use client'

import { useEffect, useState, use } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type PlanAction = {
  action: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  estimated_cost?: number
  time_required?: string
  responsible_party?: string
  completed?: boolean
}

export default function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<any>(null)
  const [pre, setPre] = useState<PlanAction[]>([])
  const [during, setDuring] = useState<PlanAction[]>([])
  const [post, setPost] = useState<PlanAction[]>([])
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
        setPre(data?.pre_crisis_actions || [])
        setDuring(data?.during_crisis_actions || [])
        setPost(data?.post_crisis_actions || [])
      } catch (e: any) {
        setError(e.message || 'Failed to load plan')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, id])

  const updateAction = (list: PlanAction[], setList: any, idx: number, patch: Partial<PlanAction>) => {
    const next = [...list]
    next[idx] = { ...next[idx], ...patch }
    setList(next)
  }
  const addAction = (list: PlanAction[], setList: any) => setList([...list, { action: '', priority: 'medium' }])
  const removeAction = (list: PlanAction[], setList: any, idx: number) => setList(list.filter((_, i) => i !== idx))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase
        .from('emergency_plans')
        .update({
          plan_name: plan.plan_name,
          plan_type: plan.plan_type,
          status: plan.status,
          pre_crisis_actions: pre,
          during_crisis_actions: during,
          post_crisis_actions: post
        })
        .eq('id', plan.id)
      if (err) throw err
    } catch (e: any) {
      setError(e.message || 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null
  if (loading) return <Container className="py-5"><Card><Card.Body>Loading...</Card.Body></Card></Container>
  if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>

  const actionFields = (list: PlanAction[], setList: any, title: string) => (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <strong>{title}</strong>
        <Button size="sm" variant="outline-primary" onClick={() => addAction(list, setList)}>Add Action</Button>
      </Card.Header>
      <Card.Body>
        {list.length === 0 ? <p className="text-muted">No actions.</p> : (
          list.map((a, idx) => (
            <div key={idx} className="border rounded p-2 mb-2">
              <Form.Group className="mb-2">
                <Form.Label>Action</Form.Label>
                <Form.Control value={a.action} onChange={e => updateAction(list, setList, idx, { action: e.target.value })} />
              </Form.Group>
              <div className="d-flex gap-2">
                <Form.Group className="mb-2" style={{ flex: 1 }}>
                  <Form.Label>Priority</Form.Label>
                  <Form.Select value={a.priority || 'medium'} onChange={e => updateAction(list, setList, idx, { priority: e.target.value as any })}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2" style={{ flex: 1 }}>
                  <Form.Label>Estimated Cost</Form.Label>
                  <Form.Control type="number" value={a.estimated_cost || ''} onChange={e => updateAction(list, setList, idx, { estimated_cost: e.target.value ? Number(e.target.value) : undefined })} />
                </Form.Group>
              </div>
              <div className="d-flex gap-2">
                <Form.Group className="mb-2" style={{ flex: 1 }}>
                  <Form.Label>Time Required</Form.Label>
                  <Form.Control value={a.time_required || ''} onChange={e => updateAction(list, setList, idx, { time_required: e.target.value })} />
                </Form.Group>
                <Form.Group className="mb-2" style={{ flex: 1 }}>
                  <Form.Label>Responsible</Form.Label>
                  <Form.Control value={a.responsible_party || ''} onChange={e => updateAction(list, setList, idx, { responsible_party: e.target.value })} />
                </Form.Group>
              </div>
              <div className="text-end">
                <Button size="sm" variant="outline-danger" onClick={() => removeAction(list, setList, idx)}>Remove</Button>
              </div>
            </div>
          ))
        )}
      </Card.Body>
    </Card>
  )

  return (
    <Container fluid className="py-4">
      <Row className="mb-3">
        <Col className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Edit Plan</h2>
          <div className="d-flex gap-2">
            <Link href={`/plans/${plan.id}`}><Button variant="outline-secondary">Cancel</Button></Link>
            <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header><strong>General</strong></Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Plan Name</Form.Label>
                <Form.Control value={plan.plan_name} onChange={e => setPlan({ ...plan, plan_name: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Plan Type</Form.Label>
                <Form.Control value={plan.plan_type} onChange={e => setPlan({ ...plan, plan_type: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select value={plan.status} onChange={e => setPlan({ ...plan, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="in_use">In Use</option>
                  <option value="archived">Archived</option>
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {actionFields(during, setDuring, 'During Crisis')}
      {actionFields(post, setPost, 'Post-Crisis Recovery')}
      {actionFields(pre, setPre, 'Pre-Crisis Preparation')}
    </Container>
  )
}


