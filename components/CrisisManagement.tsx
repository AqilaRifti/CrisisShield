'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Badge, Button, Alert, Modal, Form, ListGroup, ProgressBar } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'

interface CrisisEvent {
    id: string
    title: string
    crisis_type: string
    severity: string
    status: string
    started_at: string
    ended_at?: string
    description: string
    ai_guidance?: string[]
    emergency_plan_id?: string
}

interface Props {
    businessId: string
    onCrisisUpdate?: () => void
}

const CRISIS_TYPES = [
    'natural_disaster', 'pandemic', 'economic_crisis', 'supply_chain',
    'cyber_attack', 'fire', 'flood', 'earthquake', 'other'
]

const SEVERITY_LEVELS = [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'moderate', label: 'Moderate', color: 'info' },
    { value: 'high', label: 'High', color: 'warning' },
    { value: 'critical', label: 'Critical', color: 'danger' }
]

export default function CrisisManagement({ businessId, onCrisisUpdate }: Props) {
    const [crises, setCrises] = useState<CrisisEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedCrisis, setSelectedCrisis] = useState<CrisisEvent | null>(null)
    const [newCrisis, setNewCrisis] = useState({
        title: '',
        crisis_type: 'other',
        severity: 'moderate',
        description: ''
    })

    useEffect(() => {
        loadCrises()
    }, [businessId])

    const loadCrises = async () => {
        try {
            const { data, error } = await supabase
                .from('crisis_events')
                .select('*')
                .eq('business_id', businessId)
                .order('started_at', { ascending: false })

            if (error) throw error
            setCrises(data || [])
        } catch (err) {
            console.error('Failed to load crises:', err)
        } finally {
            setLoading(false)
        }
    }

    const createCrisis = async () => {
        try {
            const { error } = await supabase
                .from('crisis_events')
                .insert({
                    business_id: businessId,
                    ...newCrisis,
                    status: 'active',
                    started_at: new Date().toISOString(),
                    ai_guidance: generateInitialGuidance(newCrisis.crisis_type, newCrisis.severity)
                })

            if (error) throw error

            setShowModal(false)
            setNewCrisis({ title: '', crisis_type: 'other', severity: 'moderate', description: '' })
            loadCrises()
            onCrisisUpdate?.()
        } catch (err) {
            console.error('Failed to create crisis:', err)
        }
    }

    const updateCrisisStatus = async (crisisId: string, status: string) => {
        try {
            const updateData: any = { status }
            if (status === 'resolved') {
                updateData.ended_at = new Date().toISOString()
            }

            const { error } = await supabase
                .from('crisis_events')
                .update(updateData)
                .eq('id', crisisId)

            if (error) throw error

            setCrises(prev => prev.map(c =>
                c.id === crisisId ? { ...c, status, ended_at: updateData.ended_at } : c
            ))
            onCrisisUpdate?.()
        } catch (err) {
            console.error('Failed to update crisis:', err)
        }
    }

    const generateInitialGuidance = (type: string, severity: string): string[] => {
        const baseGuidance = [
            'Ensure immediate safety of all personnel',
            'Activate emergency communication protocols',
            'Contact relevant authorities if necessary',
            'Document all incidents and responses'
        ]

        const typeSpecific: Record<string, string[]> = {
            natural_disaster: ['Evacuate if necessary', 'Secure physical assets', 'Check structural integrity'],
            pandemic: ['Implement health protocols', 'Enable remote work', 'Monitor staff health'],
            cyber_attack: ['Disconnect affected systems', 'Change all passwords', 'Contact cybersecurity experts'],
            fire: ['Evacuate immediately', 'Call fire department', 'Account for all personnel'],
            flood: ['Move to higher ground', 'Shut off utilities', 'Protect critical equipment']
        }

        return [...baseGuidance, ...(typeSpecific[type] || [])]
    }

    const getSeverityInfo = (severity: string) => {
        return SEVERITY_LEVELS.find(s => s.value === severity) || SEVERITY_LEVELS[1]
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'danger'
            case 'monitoring': return 'warning'
            case 'resolved': return 'success'
            case 'occurred': return 'info'
            default: return 'secondary'
        }
    }

    if (loading) return <Card><Card.Body>Loading crisis data...</Card.Body></Card>

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Crisis Management</h5>
                <Button variant="danger" onClick={() => setShowModal(true)}>
                    Report New Crisis
                </Button>
            </div>

            {crises.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-4">
                        <p className="text-muted">No crisis events recorded</p>
                        <Button variant="outline-danger" onClick={() => setShowModal(true)}>
                            Report First Crisis
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {crises.map((crisis) => {
                        const severityInfo = getSeverityInfo(crisis.severity)
                        const isActive = crisis.status === 'active'

                        return (
                            <Col md={6} key={crisis.id} className="mb-3">
                                <Card className={`h-100 ${isActive ? 'border-danger' : ''}`}>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-1">{crisis.title}</h6>
                                            <div className="d-flex gap-2">
                                                <Badge bg={severityInfo.color}>{severityInfo.label}</Badge>
                                                <Badge bg={getStatusColor(crisis.status)}>{crisis.status.toUpperCase()}</Badge>
                                                <Badge bg="secondary">{crisis.crisis_type.replace('_', ' ')}</Badge>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <div className="text-danger">
                                                <i className="bi bi-exclamation-triangle-fill"></i>
                                            </div>
                                        )}
                                    </Card.Header>

                                    <Card.Body>
                                        <p className="small text-muted mb-2">{crisis.description}</p>

                                        <div className="mb-2">
                                            <small className="fw-bold">Started:</small>{' '}
                                            <small>{new Date(crisis.started_at).toLocaleString()}</small>
                                        </div>

                                        {crisis.ended_at && (
                                            <div className="mb-2">
                                                <small className="fw-bold">Ended:</small>{' '}
                                                <small>{new Date(crisis.ended_at).toLocaleString()}</small>
                                            </div>
                                        )}

                                        {crisis.ai_guidance && crisis.ai_guidance.length > 0 && (
                                            <div>
                                                <small className="fw-bold">AI Guidance:</small>
                                                <ul className="small mt-1 mb-0">
                                                    {crisis.ai_guidance.slice(0, 3).map((guidance, idx) => (
                                                        <li key={idx}>{guidance}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </Card.Body>

                                    <Card.Footer className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => setSelectedCrisis(crisis)}
                                        >
                                            View Details
                                        </Button>

                                        {isActive && (
                                            <>
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    onClick={() => updateCrisisStatus(crisis.id, 'monitoring')}
                                                >
                                                    Monitor
                                                </Button>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => updateCrisisStatus(crisis.id, 'resolved')}
                                                >
                                                    Resolve
                                                </Button>
                                            </>
                                        )}
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            )}

            {/* Create Crisis Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Report New Crisis</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Crisis Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={newCrisis.title}
                                onChange={(e) => setNewCrisis({ ...newCrisis, title: e.target.value })}
                                placeholder="Brief description of the crisis"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Crisis Type</Form.Label>
                            <Form.Select
                                value={newCrisis.crisis_type}
                                onChange={(e) => setNewCrisis({ ...newCrisis, crisis_type: e.target.value })}
                            >
                                {CRISIS_TYPES.map(type => (
                                    <option key={type} value={type}>
                                        {type.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Severity Level</Form.Label>
                            <Form.Select
                                value={newCrisis.severity}
                                onChange={(e) => setNewCrisis({ ...newCrisis, severity: e.target.value })}
                            >
                                {SEVERITY_LEVELS.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newCrisis.description}
                                onChange={(e) => setNewCrisis({ ...newCrisis, description: e.target.value })}
                                placeholder="Detailed description of the crisis situation"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={createCrisis}
                        disabled={!newCrisis.title.trim()}
                    >
                        Report Crisis
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Crisis Details Modal */}
            <Modal show={!!selectedCrisis} onHide={() => setSelectedCrisis(null)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedCrisis?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCrisis && (
                        <div>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Type:</strong> {selectedCrisis.crisis_type.replace('_', ' ')}
                                </Col>
                                <Col md={6}>
                                    <strong>Severity:</strong>{' '}
                                    <Badge bg={getSeverityInfo(selectedCrisis.severity).color}>
                                        {getSeverityInfo(selectedCrisis.severity).label}
                                    </Badge>
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Status:</strong>{' '}
                                    <Badge bg={getStatusColor(selectedCrisis.status)}>
                                        {selectedCrisis.status.toUpperCase()}
                                    </Badge>
                                </Col>
                                <Col md={6}>
                                    <strong>Started:</strong> {new Date(selectedCrisis.started_at).toLocaleString()}
                                </Col>
                            </Row>

                            {selectedCrisis.ended_at && (
                                <Row className="mb-3">
                                    <Col>
                                        <strong>Ended:</strong> {new Date(selectedCrisis.ended_at).toLocaleString()}
                                    </Col>
                                </Row>
                            )}

                            <div className="mb-3">
                                <strong>Description:</strong>
                                <p className="mt-1">{selectedCrisis.description}</p>
                            </div>

                            {selectedCrisis.ai_guidance && selectedCrisis.ai_guidance.length > 0 && (
                                <Card>
                                    <Card.Header>AI Guidance & Recommendations</Card.Header>
                                    <Card.Body>
                                        <ListGroup variant="flush">
                                            {selectedCrisis.ai_guidance.map((guidance, idx) => (
                                                <ListGroup.Item key={idx}>{guidance}</ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setSelectedCrisis(null)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}