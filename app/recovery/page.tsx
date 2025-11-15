"use client"

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Alert, Form, Modal } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import RecoveryDashboard from '@/components/RecoveryDashboard'

export default function RecoveryPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [crisisEvents, setCrisisEvents] = useState<any[]>([])
  const [selectedCrisis, setSelectedCrisis] = useState('')

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
          // Load crisis events that don't have recovery tracking yet
          const { data: crises } = await supabase
            .from('crisis_events')
            .select('*')
            .eq('business_id', prof.id)
            .in('status', ['active', 'occurred'])
            .order('started_at', { ascending: false })

          setCrisisEvents(crises || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const createRecoveryTracking = async () => {
    if (!profile?.id || !selectedCrisis) return

    try {
      const { error } = await supabase
        .from('recovery_progress')
        .insert({
          business_id: profile.id,
          crisis_event_id: selectedCrisis,
          recovery_stage: 'assessment',
          operational_capacity_percent: 0,
          revenue_recovery_percent: 0,
          milestones_completed: [],
          next_actions: [
            'Assess damage and immediate needs',
            'Secure premises and ensure safety',
            'Contact insurance providers',
            'Notify key stakeholders',
            'Activate emergency plan'
          ]
        })

      if (error) throw error

      setShowCreateModal(false)
      setSelectedCrisis('')
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to create recovery tracking:', err)
    }
  }

  if (!user) return null

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-5">Recovery Management</h1>
            <p className="text-muted">Track and manage your business recovery from crises</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              disabled={crisisEvents.length === 0}
            >
              Start Recovery Tracking
            </Button>
            <Link href="/dashboard">
              <Button variant="outline-secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </Col>
      </Row>

      {loading ? (
        <Card><Card.Body>Loading...</Card.Body></Card>
      ) : profile?.id ? (
        <RecoveryDashboard businessId={profile.id} />
      ) : (
        <Alert variant="warning">Business profile not found</Alert>
      )}

      {/* Create Recovery Tracking Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Start Recovery Tracking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Crisis Event</Form.Label>
            <Form.Select
              value={selectedCrisis}
              onChange={(e) => setSelectedCrisis(e.target.value)}
            >
              <option value="">Choose a crisis event...</option>
              {crisisEvents.map(crisis => (
                <option key={crisis.id} value={crisis.id}>
                  {crisis.title} - {new Date(crisis.started_at).toLocaleDateString()}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Select an active or occurred crisis to begin tracking recovery progress
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={createRecoveryTracking}
            disabled={!selectedCrisis}
          >
            Start Tracking
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

