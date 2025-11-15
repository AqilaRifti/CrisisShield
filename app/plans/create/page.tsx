'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'

export default function CreateEmergencyPlanPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [planData, setPlanData] = useState<any>(null)

  const [formData, setFormData] = useState({
    crisisType: '',
    planName: '',
    situationDescription: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get business profile
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('clerk_id', user?.id)
        .single()

      if (!profile) {
        throw new Error('Business profile not found')
      }

      // Generate plan with AI
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: profile.id,
          crisisType: formData.crisisType,
          planName: formData.planName || `${formData.crisisType} Emergency Plan`,
          businessType: profile.business_type,
          location: `${profile.city}, ${profile.country}`,
          employeeCount: profile.employee_count,
          revenue: profile.annual_revenue,
          situationDescription: formData.situationDescription
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate plan')
      }

      const result = await response.json()
      setPlanData(result.plan)
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async () => {
    if (!planData) return

    setLoading(true)
    try {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('clerk_id', user?.id)
        .single()

      const { error } = await supabase
        .from('emergency_plans')
        .insert({
          business_id: profile.id,
          plan_type: formData.crisisType,
          plan_name: planData.plan_name,
          pre_crisis_actions: planData.pre_crisis_actions,
          during_crisis_actions: planData.during_crisis_actions,
          post_crisis_actions: planData.post_crisis_actions,
          required_resources: planData.required_resources,
          estimated_cost: planData.estimated_total_cost,
          situation_description: formData.situationDescription,
          status: 'draft'
        })

      if (error) throw error

      router.push('/plans')
    } catch (err: any) {
      setError(err.message || 'Failed to save plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">Create Emergency Plan</h3>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              {!planData ? (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Crisis Type *</Form.Label>
                    <Form.Select
                      required
                      value={formData.crisisType}
                      onChange={(e) => setFormData({ ...formData, crisisType: e.target.value })}
                    >
                      <option value="">Select crisis type...</option>
                      <option value="flood">Flood</option>
                      <option value="fire">Fire</option>
                      <option value="pandemic">Pandemic</option>
                      <option value="earthquake">Earthquake</option>
                      <option value="economic_downturn">Economic Downturn</option>
                      <option value="typhoon">Typhoon/Hurricane</option>
                      <option value="power_outage">Power Outage</option>
                      <option value="supply_chain_disruption">Supply Chain Disruption</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Plan Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.planName}
                      onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                      placeholder="Leave empty to auto-generate"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      Situation Description <span className="text-muted">(Optional)</span>
                      <span className="float-end text-muted small">
                        {formData.situationDescription.length}/500 characters
                      </span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      maxLength={500}
                      value={formData.situationDescription}
                      onChange={(e) => setFormData({ ...formData, situationDescription: e.target.value })}
                      placeholder="Describe your specific situation, vulnerabilities, or concerns to help generate a more tailored emergency plan. For example: 'Our business is located in a flood-prone area with limited backup power. We have elderly customers who may need assistance during evacuations. Our main concern is protecting our inventory and ensuring customer safety.'"
                    />
                    <Form.Text className="text-muted">
                      <strong>Examples of helpful context:</strong>
                      <ul className="mt-2 mb-2">
                        <li>Location vulnerabilities (flood-prone area, earthquake zone, etc.)</li>
                        <li>Customer demographics (elderly customers, families with children)</li>
                        <li>Key assets to protect (inventory, equipment, data servers)</li>
                        <li>Past experiences with similar crises</li>
                        <li>Specific operational constraints or dependencies</li>
                        <li>Unique business characteristics or challenges</li>
                      </ul>
                      <details className="mt-2">
                        <summary className="text-primary" style={{ cursor: 'pointer' }}>
                          <small>View example descriptions</small>
                        </summary>
                        <div className="mt-2 p-2 bg-light rounded">
                          <small>
                            <strong>Restaurant example:</strong> "We're a family restaurant in a flood-prone area. Our main concerns are food safety during power outages and ensuring elderly regular customers can evacuate safely. We have limited cold storage backup and depend heavily on daily fresh deliveries."
                            <br /><br />
                            <strong>Retail store example:</strong> "Our electronics store is in a shopping mall with limited exits. We have expensive inventory that needs protection from water damage and theft. Many of our customers are young families, and we're concerned about crowd management during evacuations."
                          </small>
                        </div>
                      </details>
                    </Form.Text>
                  </Form.Group>

                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Generating Plan...
                      </>
                    ) : (
                      'Generate Plan'
                    )}
                  </Button>
                </Form>
              ) : (
                <div>
                  <h4>{planData.plan_name}</h4>

                  {formData.situationDescription && (
                    <Card className="mb-4">
                      <Card.Header>Situation Context</Card.Header>
                      <Card.Body>
                        <p className="mb-0">{formData.situationDescription}</p>
                      </Card.Body>
                    </Card>
                  )}

                  <div className="mb-4">
                    <h5>Pre-Crisis Actions</h5>
                    <ul>
                      {planData.pre_crisis_actions?.map((action: any, idx: number) => (
                        <li key={idx}>
                          <strong>{action.priority}:</strong> {action.action}
                          {action.estimated_cost && ` (Cost: $${action.estimated_cost})`}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h5>During Crisis Actions</h5>
                    <ul>
                      {planData.during_crisis_actions?.map((action: any, idx: number) => (
                        <li key={idx}>
                          <strong>{action.priority}:</strong> {action.action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h5>Post-Crisis Recovery</h5>
                    <ul>
                      {planData.post_crisis_actions?.map((action: any, idx: number) => (
                        <li key={idx}>
                          <strong>{action.priority}:</strong> {action.action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h5>Estimated Total Cost: ${planData.estimated_total_cost || 0}</h5>
                  </div>

                  <div className="d-flex gap-2">
                    <Button variant="primary" onClick={handleSavePlan} disabled={loading}>
                      Save Plan
                    </Button>
                    <Button variant="outline-secondary" onClick={() => setPlanData(null)}>
                      Create Another
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

