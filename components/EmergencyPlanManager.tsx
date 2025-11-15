'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Badge, Button, Modal, Form, ListGroup, ProgressBar, Alert } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'
import { computeActionCompletionPercent, deriveNextActions } from '@/lib/recovery'

interface EmergencyPlan {
    id: string
    plan_name: string
    plan_type: string
    status: string
    pre_crisis_actions: any[]
    during_crisis_actions: any[]
    post_crisis_actions: any[]
    required_resources: any
    estimated_cost: number
    situation_description?: string
    last_reviewed_at: string
    created_at: string
}

interface Props {
    businessId: string
    onPlanUpdate?: () => void
}

const PLAN_TYPES = [
    'natural_disaster', 'pandemic', 'fire_emergency', 'cyber_attack',
    'supply_chain', 'financial_crisis', 'general_emergency'
]

const ACTION_PRIORITIES = [
    { value: 'critical', label: 'Critical', color: 'danger' },
    { value: 'high', label: 'High', color: 'warning' },
    { value: 'medium', label: 'Medium', color: 'info' },
    { value: 'low', label: 'Low', color: 'success' }
]

export default function EmergencyPlanManager({ businessId, onPlanUpdate }: Props) {
    const [plans, setPlans] = useState<EmergencyPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<EmergencyPlan | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [newAction, setNewAction] = useState({
        phase: 'pre_crisis_actions',
        action: '',
        priority: 'medium',
        estimated_cost: 0,
        time_required: '',
        responsible_party: ''
    })

    useEffect(() => {
        loadPlans()
    }, [businessId])

    const loadPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('emergency_plans')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setPlans(data || [])
        } catch (err) {
            console.error('Failed to load plans:', err)
        } finally {
            setLoading(false)
        }
    }

    const updatePlanStatus = async (planId: string, status: string) => {
        try {
            const { error } = await supabase
                .from('emergency_plans')
                .update({
                    status,
                    last_reviewed_at: new Date().toISOString()
                })
                .eq('id', planId)

            if (error) throw error

            setPlans(prev => prev.map(p =>
                p.id === planId ? { ...p, status, last_reviewed_at: new Date().toISOString() } : p
            ))
            onPlanUpdate?.()
        } catch (err) {
            console.error('Failed to update plan status:', err)
        }
    }

    const addActionToPlan = async (planId: string) => {
        if (!selectedPlan || !newAction.action.trim()) return

        try {
            const updatedActions = [
                ...(selectedPlan[newAction.phase as keyof EmergencyPlan] as any[] || []),
                {
                    action: newAction.action,
                    priority: newAction.priority,
                    estimated_cost: newAction.estimated_cost || 0,
                    time_required: newAction.time_required,
                    responsible_party: newAction.responsible_party,
                    completed: false,
                    id: Date.now().toString()
                }
            ]

            const { error } = await supabase
                .from('emergency_plans')
                .update({
                    [newAction.phase]: updatedActions,
                    last_reviewed_at: new Date().toISOString()
                })
                .eq('id', planId)

            if (error) throw error

            setSelectedPlan({
                ...selectedPlan,
                [newAction.phase]: updatedActions,
                last_reviewed_at: new Date().toISOString()
            })

            setPlans(prev => prev.map(p =>
                p.id === planId ? {
                    ...p,
                    [newAction.phase]: updatedActions,
                    last_reviewed_at: new Date().toISOString()
                } : p
            ))

            setNewAction({
                phase: 'pre_crisis_actions',
                action: '',
                priority: 'medium',
                estimated_cost: 0,
                time_required: '',
                responsible_party: ''
            })

            onPlanUpdate?.()
        } catch (err) {
            console.error('Failed to add action:', err)
        }
    }

    const toggleActionCompletion = async (planId: string, phase: string, actionIndex: number) => {
        if (!selectedPlan) return

        try {
            const actions = [...(selectedPlan[phase as keyof EmergencyPlan] as any[])]
            actions[actionIndex] = {
                ...actions[actionIndex],
                completed: !actions[actionIndex].completed
            }

            const { error } = await supabase
                .from('emergency_plans')
                .update({
                    [phase]: actions,
                    last_reviewed_at: new Date().toISOString()
                })
                .eq('id', planId)

            if (error) throw error

            setSelectedPlan({
                ...selectedPlan,
                [phase]: actions,
                last_reviewed_at: new Date().toISOString()
            })

            setPlans(prev => prev.map(p =>
                p.id === planId ? {
                    ...p,
                    [phase]: actions,
                    last_reviewed_at: new Date().toISOString()
                } : p
            ))

            onPlanUpdate?.()
        } catch (err) {
            console.error('Failed to toggle action:', err)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success'
            case 'in_use': return 'warning'
            case 'draft': return 'secondary'
            case 'archived': return 'dark'
            default: return 'secondary'
        }
    }

    const getPriorityColor = (priority: string) => {
        const priorityInfo = ACTION_PRIORITIES.find(p => p.value === priority)
        return priorityInfo?.color || 'secondary'
    }

    if (loading) return <Card><Card.Body>Loading emergency plans...</Card.Body></Card>

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Emergency Plans</h5>
                <Button variant="primary" href="/plans/create">
                    Create New Plan
                </Button>
            </div>

            {plans.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-4">
                        <p className="text-muted">No emergency plans created yet</p>
                        <Button variant="outline-primary" href="/plans/create">
                            Create Your First Plan
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {plans.map((plan) => {
                        const completionPercent = computeActionCompletionPercent(plan)
                        const nextActions = deriveNextActions(plan, 3)

                        return (
                            <Col md={6} key={plan.id} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-1">{plan.plan_name}</h6>
                                            <div className="d-flex gap-2">
                                                <Badge bg={getStatusColor(plan.status)}>{plan.status.toUpperCase()}</Badge>
                                                <Badge bg="secondary">{plan.plan_type.replace('_', ' ')}</Badge>
                                                {plan.situation_description && (
                                                    <Badge bg="info" title="Has situation context">
                                                        <i className="bi bi-info-circle"></i> Context
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-bold text-primary">{completionPercent}%</div>
                                            <small className="text-muted">Complete</small>
                                        </div>
                                    </Card.Header>

                                    <Card.Body>
                                        <div className="mb-3">
                                            <ProgressBar
                                                now={completionPercent}
                                                variant="primary"
                                                className="mb-2"
                                            />
                                            <small className="text-muted">Action Completion Progress</small>
                                        </div>

                                        {plan.estimated_cost > 0 && (
                                            <div className="mb-2">
                                                <strong>Estimated Cost:</strong> ${plan.estimated_cost.toLocaleString()}
                                            </div>
                                        )}

                                        <div className="mb-2">
                                            <strong>Last Reviewed:</strong>{' '}
                                            {plan.last_reviewed_at
                                                ? new Date(plan.last_reviewed_at).toLocaleDateString()
                                                : 'Never'
                                            }
                                        </div>

                                        {nextActions.length > 0 && (
                                            <div>
                                                <strong>Next Actions:</strong>
                                                <ul className="small mt-1 mb-0">
                                                    {nextActions.map((action, idx) => (
                                                        <li key={idx}>{action}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </Card.Body>

                                    <Card.Footer className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedPlan(plan)
                                                setEditMode(false)
                                                setShowModal(true)
                                            }}
                                        >
                                            View Details
                                        </Button>

                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedPlan(plan)
                                                setEditMode(true)
                                                setShowModal(true)
                                            }}
                                        >
                                            Edit
                                        </Button>

                                        <Form.Select
                                            size="sm"
                                            value={plan.status}
                                            onChange={(e) => updatePlanStatus(plan.id, e.target.value)}
                                            style={{ width: 'auto' }}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="active">Active</option>
                                            <option value="in_use">In Use</option>
                                            <option value="archived">Archived</option>
                                        </Form.Select>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            )}

            {/* Plan Details/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editMode ? 'Edit Plan: ' : 'Plan Details: '}{selectedPlan?.plan_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPlan && (
                        <div>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <strong>Type:</strong> {selectedPlan.plan_type.replace('_', ' ')}
                                </Col>
                                <Col md={6}>
                                    <strong>Status:</strong>{' '}
                                    <Badge bg={getStatusColor(selectedPlan.status)}>
                                        {selectedPlan.status.toUpperCase()}
                                    </Badge>
                                </Col>
                            </Row>

                            {selectedPlan.situation_description && (
                                <Card className="mb-4">
                                    <Card.Header>Situation Context</Card.Header>
                                    <Card.Body>
                                        <p className="mb-0">{selectedPlan.situation_description}</p>
                                    </Card.Body>
                                </Card>
                            )}

                            {editMode && (
                                <Card className="mb-4">
                                    <Card.Header>Add New Action</Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Phase</Form.Label>
                                                    <Form.Select
                                                        value={newAction.phase}
                                                        onChange={(e) => setNewAction({ ...newAction, phase: e.target.value })}
                                                    >
                                                        <option value="pre_crisis_actions">Pre-Crisis</option>
                                                        <option value="during_crisis_actions">During Crisis</option>
                                                        <option value="post_crisis_actions">Post-Crisis</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Priority</Form.Label>
                                                    <Form.Select
                                                        value={newAction.priority}
                                                        onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })}
                                                    >
                                                        {ACTION_PRIORITIES.map(priority => (
                                                            <option key={priority.value} value={priority.value}>
                                                                {priority.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Action Description</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={newAction.action}
                                                onChange={(e) => setNewAction({ ...newAction, action: e.target.value })}
                                                placeholder="Describe the action to be taken..."
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Estimated Cost ($)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={newAction.estimated_cost}
                                                        onChange={(e) => setNewAction({ ...newAction, estimated_cost: parseInt(e.target.value) || 0 })}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Time Required</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={newAction.time_required}
                                                        onChange={(e) => setNewAction({ ...newAction, time_required: e.target.value })}
                                                        placeholder="e.g., 2 hours, 1 day"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Responsible Party</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={newAction.responsible_party}
                                                        onChange={(e) => setNewAction({ ...newAction, responsible_party: e.target.value })}
                                                        placeholder="Who is responsible"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Button
                                            variant="primary"
                                            onClick={() => addActionToPlan(selectedPlan.id)}
                                            disabled={!newAction.action.trim()}
                                        >
                                            Add Action
                                        </Button>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Action Lists */}
                            {['pre_crisis_actions', 'during_crisis_actions', 'post_crisis_actions'].map(phase => {
                                const actions = selectedPlan[phase as keyof EmergencyPlan] as any[] || []
                                const phaseLabel = phase.replace('_', ' ').replace('actions', '').trim()

                                return (
                                    <Card key={phase} className="mb-3">
                                        <Card.Header>
                                            {phaseLabel.charAt(0).toUpperCase() + phaseLabel.slice(1)} Actions ({actions.length})
                                        </Card.Header>
                                        <Card.Body>
                                            {actions.length === 0 ? (
                                                <p className="text-muted">No actions defined for this phase</p>
                                            ) : (
                                                <ListGroup variant="flush">
                                                    {actions.map((action, idx) => (
                                                        <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-start">
                                                            <div className="flex-grow-1">
                                                                {editMode ? (
                                                                    <Form.Check
                                                                        type="checkbox"
                                                                        checked={action.completed || false}
                                                                        onChange={() => toggleActionCompletion(selectedPlan.id, phase, idx)}
                                                                        label={action.action}
                                                                        className={action.completed ? 'text-decoration-line-through' : ''}
                                                                    />
                                                                ) : (
                                                                    <div className={action.completed ? 'text-decoration-line-through text-muted' : ''}>
                                                                        {action.action}
                                                                        {action.completed && <Badge bg="success" className="ms-2">Completed</Badge>}
                                                                    </div>
                                                                )}

                                                                <div className="mt-1">
                                                                    <Badge bg={getPriorityColor(action.priority)} className="me-2">
                                                                        {action.priority}
                                                                    </Badge>
                                                                    {action.estimated_cost > 0 && (
                                                                        <Badge bg="secondary" className="me-2">
                                                                            ${action.estimated_cost}
                                                                        </Badge>
                                                                    )}
                                                                    {action.time_required && (
                                                                        <Badge bg="info" className="me-2">
                                                                            {action.time_required}
                                                                        </Badge>
                                                                    )}
                                                                    {action.responsible_party && (
                                                                        <Badge bg="light" text="dark">
                                                                            {action.responsible_party}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            )}
                                        </Card.Body>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    {editMode && (
                        <Button variant="primary" onClick={() => setEditMode(false)}>
                            Save Changes
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    )
}