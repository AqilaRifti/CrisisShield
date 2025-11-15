'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState('')
  const [progress, setProgress] = useState(0)

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'retail',
    industry: '',
    employeeCount: '',
    annualRevenue: '',
    address: '',
    city: '',
    country: 'ID',
    phone: '',
    alertSms: true,
    alertEmail: true,
    alertPush: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setProgress(0)

    try {
      // Step 1: Validate and prepare data
      setLoadingStep('Preparing your business profile...')
      setProgress(20)

      const latitude = 0
      const longitude = 0

      // Step 2: Check for existing profile
      setLoadingStep('Checking existing data...')
      setProgress(30)

      const { data: existing } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('clerk_id', user?.id)
        .maybeSingle()

      let profileId: string | null = existing?.id || null

      // Step 3: Create or update profile
      setLoadingStep('Saving your business information...')
      setProgress(50)

      if (!profileId) {
        const email = (user as any)?.primaryEmailAddress?.emailAddress || (user as any)?.emailAddresses?.[0]?.emailAddress || ''
        const { data: inserted, error: insertError } = await supabase
          .from('business_profiles')
          .insert({
            clerk_id: user?.id,
            email,
            business_name: formData.businessName || 'My Business',
            business_type: formData.businessType,
            country: formData.country
          })
          .select('id')
          .single()
        if (insertError) throw insertError
        profileId = inserted.id
      }

      const { data, error: updateError } = await supabase
        .from('business_profiles')
        .update({
          business_name: formData.businessName,
          business_type: formData.businessType,
          industry: formData.industry,
          employee_count: formData.employeeCount ? parseInt(formData.employeeCount) : null,
          annual_revenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : null,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          phone: formData.phone,
          latitude,
          longitude,
          alert_preferences: {
            sms: formData.alertSms,
            email: formData.alertEmail,
            push: formData.alertPush
          }
        })
        .eq('id', profileId)
        .select()
        .single()

      if (updateError) throw updateError

      // Step 4: Analyze threats
      setLoadingStep('Analyzing potential threats for your business...')
      setProgress(75)

      await fetch('/api/threats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: data.id })
      })

      // Step 5: Complete
      setLoadingStep('Setting up your dashboard...')
      setProgress(90)

      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress(100)
      setLoadingStep('Complete! Redirecting...')

      // Redirect to dashboard
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
      setLoading(false)
      setProgress(0)
      setLoadingStep('')
    }
  }

  return (
    <Container className="py-5">
      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Card style={{ maxWidth: '550px', width: '90%' }} className="shadow-lg">
            <Card.Body className="text-center p-5">
              <div className="mb-4">
                <Spinner
                  animation="border"
                  variant="primary"
                  style={{ width: '4rem', height: '4rem' }}
                />
              </div>

              <h4 className="mb-3 text-primary">{loadingStep}</h4>

              <ProgressBar
                now={progress}
                variant={progress === 100 ? 'success' : 'primary'}
                animated={progress < 100}
                className="mb-3"
                style={{ height: '12px', borderRadius: '6px' }}
              />

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">{progress}% Complete</span>
                {progress === 100 && (
                  <span className="text-success fw-bold">
                    ✓ Done!
                  </span>
                )}
              </div>

              <Alert variant="info" className="mb-0 text-start">
                <small>
                  <strong>What's happening:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Creating your business profile</li>
                    <li>Analyzing potential threats in your area</li>
                    <li>Setting up your personalized dashboard</li>
                  </ul>
                </small>
              </Alert>

              <small className="text-muted d-block mt-3">
                Please don't close this window
              </small>
            </Card.Body>
          </Card>
        </div>
      )}

      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">Complete Your Business Profile</h3>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Business Name *</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Business Type *</Form.Label>
                      <Form.Select
                        required
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      >
                        <option value="retail">Retail</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="services">Services</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="hospitality">Hospitality</option>
                        <option value="construction">Construction</option>
                        <option value="other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Industry</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g., Electronics, Food & Beverage"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Number of Employees</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Annual Revenue (USD)</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.annualRevenue}
                        onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Full Address *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country *</Form.Label>
                      <Form.Select
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      >
                        <option value="ID">Indonesia</option>
                        <option value="PH">Philippines</option>
                        <option value="IN">India</option>
                        <option value="BD">Bangladesh</option>
                        <option value="VN">Vietnam</option>
                        <option value="TH">Thailand</option>
                        <option value="MY">Malaysia</option>
                        <option value="SG">Singapore</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number (for SMS alerts)</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+621234567890"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Alert Preferences</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      label="SMS Alerts"
                      checked={formData.alertSms}
                      onChange={(e) => setFormData({ ...formData, alertSms: e.target.checked })}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Email Alerts"
                      checked={formData.alertEmail}
                      onChange={(e) => setFormData({ ...formData, alertEmail: e.target.checked })}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Push Notifications"
                      checked={formData.alertPush}
                      onChange={(e) => setFormData({ ...formData, alertPush: e.target.checked })}
                    />
                  </div>
                </Form.Group>

                <Button variant="primary" type="submit" disabled={loading} size="lg" className="w-100">
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    'Complete Setup & Continue'
                  )}
                </Button>
                <small className="text-muted d-block mt-2 text-center">
                  This will analyze your business and set up your personalized dashboard
                </small>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

