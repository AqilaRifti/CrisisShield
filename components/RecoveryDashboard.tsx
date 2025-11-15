'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, ProgressBar, Badge, Button, Form, Alert, Modal, ListGroup } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'
import { computeActionCompletionPercent, deriveNextActions, estimateOperationalCapacityFromPlan } from '@/lib/recovery'

interface RecoveryData {
    id: string
    recovery_stage: string
    operational_capacity_percent: number
    revenue_recovery_percent: number
    milestones_completed: any[]
    next_actions: string[]
    crisis_events: any
    estimated_full_recovery_date?: string
}

interface Props {
    businessId: string
    onUpdate?: () => void
}

const RECOVERY_STAGES = [
    { value: 'assessment', label: 'Assessment', color: 'danger', description: 'Evaluating damage and immediate needs' },
    { value: 'cleanup', label: 'Cleanup', color: 'warning', description: 'Clearing debris and securing premises' },
    { value: 'rebuilding', label: 'Rebuilding', color: 'info', description: 'Repairing infrastructure and systems' },
    { value: 'reopening', label: 'Reopening', color: 'primary', description: 'Resuming limited operations' },
    { value: 'stabilization', label: 'Stabilization', color: 'success', description: 'Returning to normal operations' },
    { value: 'complete', label: 'Complete', color: 'dark', description: 'Full recovery achieved' }
]

export default function RecoveryDashboard({ businessId, onUpdate }: Props) {
    const [recoveries, setRecoveries] = useState<RecoveryData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [selectedRecovery, setSelectedRecovery] = useState<RecoveryData | null>(null)
    const [newMilestone, setNewMilestone] = useState('')

    useEffect(() => {
        loadRecoveries()
    }, [businessId])

    const loadRecoveries = async () => {
        try {
            const { data, error } = await supabase
                .from('recovery_progress')
                .select('*, crisis_events(*)')
                .eq('business_id', businessId)
                .order('updated_at', { ascending: false })

            if (error) throw error
            setRecoveries(data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const updateRecoveryStage = async (recoveryId: string, stage: string) => {
        try {
            const { error } = await supabase
                .from('recovery_progress')
                .update({
                    recovery_stage: stage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', recoveryId)

            if (error) throw error

            setRecoveries(prev => prev.map(r =>
                r.id === recoveryId ? { ...r, recovery_stage: stage } : r
            ))
            onUpdate?.()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const updateMetrics = async (recoveryId: string, operational: number, revenue: number) => {
        try {
            const { error } = await supabase
                .from('recovery_progress')
                .update({
                    operational_capacity_percent: operational,
                    revenue_recovery_percent: revenue,
                    updated_at: new Date().toISOString()
                })
                .eq('id', recoveryId)

            if (error) throw error

            setRecoveries(prev => prev.map(r =>
                r.id === recoveryId ? {
                    ...r,
                    operational_capacity_percent: operational,
                    revenue_recovery_percent: revenue
                } : r
            ))
            onUpdate?.()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const addMilestone = async (recoveryId: string, milestone: string) => {
        try {
            const recovery = recoveries.find(r => r.id === recoveryId)
            if (!recovery) return

            const newMilestones = [
                ...(recovery.milestones_completed || []),
                {
                    milestone,
                    completed_at: new Date().toISOString(),
                    id: Date.now().toString()
                }
            ]

            const { error } = await supabase
                .from('recovery_progress')
                .update({
                    milestones_completed: newMilestones,
                    updated_at: new Date().toISOString()
                })
                .eq('id', recoveryId)

            if (error) throw error

            setRecoveries(prev => prev.map(r =>
                r.id === recoveryId ? { ...r, milestones_completed: newMilestones } : r
            ))
            setNewMilestone('')
            onUpdate?.()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const getStageInfo = (stage: string) => {
        return RECOVERY_STAGES.find(s => s.value === stage) || RECOVERY_STAGES[0]
    }

    const calculateOverallProgress = (recovery: RecoveryData) => {
        const stageIndex = RECOVERY_STAGES.findIndex(s => s.value === recovery.recovery_stage)
        const stageProgress = (stageIndex / (RECOVERY_STAGES.length - 1)) * 100
        const metricsProgress = (recovery.operational_capacity_percent + recovery.revenue_recovery_percent) / 2
        return Math.round((stageProgress + metricsProgress) / 2)
    }

    if (loading) return <Card><Card.Body>Loading recovery data...</Card.Body></Card>
    if (error) return <Alert variant="danger">{error}</Alert>

    return (
        <div>
            {recoveries.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-4">
                        <p className="text-muted">No active recovery processes</p>
                        <small>Recovery tracking will appear here during crisis events</small>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {recoveries.map((recovery) => {
                        const stageInfo = getStageInfo(recovery.recovery_stage)
                        const overallProgress = calculateOverallProgress(recovery)

                        return (
                            <Col md={6} key={recovery.id} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-1">{recovery.crisis_events?.title || 'Crisis Recovery'}</h6>
                                            <Badge bg={stageInfo.color}>{stageInfo.label}</Badge>
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-bold text-primary">{overallProgress}%</div>
                                            <small className="text-muted">Overall Progress</small>
                                        </div>
                                    </Card.Header>

                                    <Card.Body>
                                        <div className="mb-3">
                                            <small className="text-muted">{stageInfo.description}</small>
                                        </div>

                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <small>Operational Capacity</small>
                                                <small>{recovery.operational_capacity_percent}%</small>
                                            </div>
                                            <ProgressBar
                                                now={recovery.operational_capacity_percent}
                                                variant="primary"
                                                className="mb-2"
                                            />

                                            <div className="d-flex justify-content-between mb-1">
                                                <small>Revenue Recovery</small>
                                                <small>{recovery.revenue_recovery_percent}%</small>
                                            </div>
                                            <ProgressBar
                                                now={recovery.revenue_recovery_percent}
                                                variant="success"
                                            />
                                        </div>

                                        {recovery.milestones_completed?.length > 0 && (
                                            <div className="mb-3">
                                                <small className="fw-bold">Recent Milestones:</small>
                                                <ul className="small mt-1 mb-0">
                                                    {recovery.milestones_completed.slice(-3).map((milestone, idx) => (
                                                        <li key={idx}>{milestone.milestone}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {recovery.next_actions?.length > 0 && (
                                            <div>
                                                <small className="fw-bold">Next Actions:</small>
                                                <ul className="small mt-1 mb-0">
                                                    {recovery.next_actions.slice(0, 3).map((action, idx) => (
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
                                                setSelectedRecovery(recovery)
                                                setShowModal(true)
                                            }}
                                        >
                                            Manage
                                        </Button>

                                        <Form.Select
                                            size="sm"
                                            value={recovery.recovery_stage}
                                            onChange={(e) => updateRecoveryStage(recovery.id, e.target.value)}
                                            style={{ width: 'auto' }}
                                        >
                                            {RECOVERY_STAGES.map(stage => (
                                                <option key={stage.value} value={stage.value}>
                                                    {stage.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            )}

            {/* Recovery Management Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Manage Recovery: {selectedRecovery?.crisis_events?.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRecovery && (
                        <div>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Card>
                                        <Card.Header>Update Metrics</Card.Header>
                                        <Card.Body>
                                            <Form.Group className="mb-3">
                                                <Form.Label>
                                                    Operational Capacity: {selectedRecovery.operational_capacity_percent}%
                                                </Form.Label>
                                                <Form.Range
                                                    value={selectedRecovery.operational_capacity_percent}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value)
                                                        setSelectedRecovery({
                                                            ...selectedRecovery,
                                                            operational_capacity_percent: value
                                                        })
                                                    }}
                                                    onMouseUp={(e) => {
                                                        const value = parseInt((e.target as HTMLInputElement).value)
                                                        updateMetrics(
                                                            selectedRecovery.id,
                                                            value,
                                                            selectedRecovery.revenue_recovery_percent
                                                        )
                                                    }}
                                                />
                                            </Form.Group>

                                            <Form.Group>
                                                <Form.Label>
                                                    Revenue Recovery: {selectedRecovery.revenue_recovery_percent}%
                                                </Form.Label>
                                                <Form.Range
                                                    value={selectedRecovery.revenue_recovery_percent}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value)
                                                        setSelectedRecovery({
                                                            ...selectedRecovery,
                                                            revenue_recovery_percent: value
                                                        })
                                                    }}
                                                    onMouseUp={(e) => {
                                                        const value = parseInt((e.target as HTMLInputElement).value)
                                                        updateMetrics(
                                                            selectedRecovery.id,
                                                            selectedRecovery.operational_capacity_percent,
                                                            value
                                                        )
                                                    }}
                                                />
                                            </Form.Group>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col md={6}>
                                    <Card>
                                        <Card.Header>Add Milestone</Card.Header>
                                        <Card.Body>
                                            <Form.Group className="mb-3">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Describe milestone achieved..."
                                                    value={newMilestone}
                                                    onChange={(e) => setNewMilestone(e.target.value)}
                                                />
                                            </Form.Group>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => addMilestone(selectedRecovery.id, newMilestone)}
                                                disabled={!newMilestone.trim()}
                                            >
                                                Add Milestone
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Card>
                                <Card.Header>Milestones History</Card.Header>
                                <Card.Body>
                                    {selectedRecovery.milestones_completed?.length > 0 ? (
                                        <ListGroup variant="flush">
                                            {selectedRecovery.milestones_completed.map((milestone, idx) => (
                                                <ListGroup.Item key={idx} className="d-flex justify-content-between">
                                                    <span>{milestone.milestone}</span>
                                                    <small className="text-muted">
                                                        {new Date(milestone.completed_at).toLocaleDateString()}
                                                    </small>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <p className="text-muted">No milestones recorded yet</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}