'use client'

import { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export default function CrisisGuidancePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [crisisEvent, setCrisisEvent] = useState<any>(null)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [eventId, setEventId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const resolvedParams = await params
      setEventId(resolvedParams.eventId)
      loadCrisisData(resolvedParams.eventId)
      loadMessages(resolvedParams.eventId)
    }
    init()
  }, [params])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadCrisisData(id: string) {
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('clerk_id', user?.id)
      .single()

    const { data: crisis } = await supabase
      .from('crisis_events')
      .select('*, emergency_plans(*)')
      .eq('id', id)
      .single()

    setBusinessProfile(profile)
    setCrisisEvent(crisis)
  }

  async function loadMessages(id: string) {
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('clerk_id', user?.id)
      .single()

    const { data } = await supabase
      .from('crisis_guidance_messages')
      .select('*')
      .eq('business_id', profile.id)
      .eq('crisis_event_id', id)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at
      })))
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !eventId) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('clerk_id', user?.id)
      .single()

    const { data: userMsg } = await supabase
      .from('crisis_guidance_messages')
      .insert({
        business_id: profile.id,
        crisis_event_id: eventId,
        role: 'user',
        content: userMessage
      })
      .select()
      .single()

    const newUserMessage = {
      id: userMsg.id,
      role: 'user' as const,
      content: userMessage,
      createdAt: userMsg.created_at
    }

    setMessages(prev => [...prev, newUserMessage])

    // Get AI response
    try {
      const response = await fetch('/api/crisis/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crisisEventId: eventId,
          businessId: profile.id,
          message: userMessage,
          context: {
            crisisType: crisisEvent?.crisis_type,
            severity: crisisEvent?.severity,
            startedAt: crisisEvent?.started_at,
            actionsTaken: crisisEvent?.response_actions || []
          }
        })
      })

      const { response: aiResponse } = await response.json()

      // Save AI response
      const { data: aiMsg } = await supabase
        .from('crisis_guidance_messages')
        .insert({
          business_id: profile.id,
          crisis_event_id: eventId,
          role: 'assistant',
          content: aiResponse,
          message_context: {
            crisisType: crisisEvent?.crisis_type,
            severity: crisisEvent?.severity
          }
        })
        .select()
        .single()

      setMessages(prev => [...prev, newUserMessage, {
        id: aiMsg.id,
        role: 'assistant',
        content: aiResponse,
        createdAt: aiMsg.created_at
      }])
    } catch (error) {
      console.error('Error getting AI response:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    'What should I do now?',
    'Assess damage',
    'Contact authorities',
    'Check emergency plan',
    'Update my team'
  ]

  const handleQuickAction = (action: string) => {
    setInput(action)
  }

  if (!crisisEvent) {
    return (
      <Container className="py-5">
        <Alert variant="info">Loading crisis data...</Alert>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">
                Crisis Guidance: {crisisEvent.title}
                <Badge bg="light" text="dark" className="ms-2">
                  {crisisEvent.severity.toUpperCase()}
                </Badge>
              </h5>
            </Card.Header>
            <Card.Body style={{ height: '500px', overflowY: 'auto' }}>
              {messages.length === 0 && (
                <div className="text-center text-muted py-5">
                  <p>Start a conversation to get guidance during this crisis.</p>
                  <p>Click a quick action below or type your question.</p>
                </div>
              )}
              
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div
                    className={`p-3 rounded ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-light'
                    }`}
                    style={{ maxWidth: '70%' }}
                  >
                    <p className="mb-0">{msg.content}</p>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="text-center text-muted">
                  <p>CrisisAI is thinking...</p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={handleSend}>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for guidance..."
                    disabled={loading}
                  />
                  <Button variant="primary" type="submit" disabled={loading}>
                    Send
                  </Button>
                </div>
              </Form>
            </Card.Footer>
          </Card>

          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action}
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h6 className="mb-0">Crisis Timeline</h6>
            </Card.Header>
            <Card.Body>
              <p><strong>Started:</strong> {new Date(crisisEvent.started_at).toLocaleString()}</p>
              {crisisEvent.ended_at && (
                <p><strong>Ended:</strong> {new Date(crisisEvent.ended_at).toLocaleString()}</p>
              )}
              <p><strong>Status:</strong> <Badge bg="warning">{crisisEvent.status}</Badge></p>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">Actions Taken</h6>
            </Card.Header>
            <Card.Body>
              {crisisEvent.response_actions && crisisEvent.response_actions.length > 0 ? (
                <ul>
                  {crisisEvent.response_actions.map((action: any, idx: number) => (
                    <li key={idx}>{action.action}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No actions recorded yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

