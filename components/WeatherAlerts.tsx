'use client'

import { useState, useEffect } from 'react'
import { Card, Alert, Badge, Spinner, Button, Modal } from 'react-bootstrap'

interface WeatherAlert {
    headline: string
    severity: string
    urgency: string
    event: string
    effective: string
    expires: string
    desc: string
    instruction: string
}

interface Props {
    location: string
}

export default function WeatherAlerts({ location }: Props) {
    const [alerts, setAlerts] = useState<WeatherAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        loadAlerts()
    }, [location])

    const loadAlerts = async () => {
        try {
            const response = await fetch(`/api/weather/alerts?location=${encodeURIComponent(location)}`)
            if (!response.ok) throw new Error('Failed to fetch alerts')
            const data = await response.json()
            setAlerts(data.alerts || [])
        } catch (err) {
            console.error('Failed to load weather alerts:', err)
        } finally {
            setLoading(false)
        }
    }

    const getSeverityColor = (severity: string) => {
        const sev = severity.toLowerCase()
        if (sev.includes('extreme') || sev.includes('severe')) return 'danger'
        if (sev.includes('moderate')) return 'warning'
        return 'info'
    }

    const getSeverityIcon = (severity: string) => {
        const sev = severity.toLowerCase()
        if (sev.includes('extreme') || sev.includes('severe')) return '🚨'
        if (sev.includes('moderate')) return '⚠️'
        return 'ℹ️'
    }

    const getUrgencyBadge = (urgency: string) => {
        const urg = urgency.toLowerCase()
        if (urg.includes('immediate')) return <Badge bg="danger">IMMEDIATE</Badge>
        if (urg.includes('expected')) return <Badge bg="warning">EXPECTED</Badge>
        return <Badge bg="info">FUTURE</Badge>
    }

    if (loading) {
        return (
            <Card>
                <Card.Body className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <small className="ms-2 text-muted">Checking alerts...</small>
                </Card.Body>
            </Card>
        )
    }

    if (alerts.length === 0) {
        return (
            <Card className="border-success">
                <Card.Body className="py-3">
                    <div className="d-flex align-items-center">
                        <span style={{ fontSize: '1.5rem' }} className="me-2">✅</span>
                        <div>
                            <strong className="text-success">No Active Weather Alerts</strong>
                            <br />
                            <small className="text-muted">Weather conditions are normal for your area</small>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        )
    }

    return (
        <>
            <Card className="shadow-sm">
                <Card.Header className="bg-danger text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">🚨 Active Weather Alerts</h6>
                        <Badge bg="light" text="dark">{alerts.length}</Badge>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {alerts.map((alert, idx) => (
                        <Alert
                            key={idx}
                            variant={getSeverityColor(alert.severity)}
                            className="mb-0 rounded-0 border-0 border-bottom"
                        >
                            <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <span style={{ fontSize: '1.2rem' }}>
                                            {getSeverityIcon(alert.severity)}
                                        </span>
                                        <strong>{alert.headline}</strong>
                                        {getUrgencyBadge(alert.urgency)}
                                    </div>

                                    <p className="mb-2 small">{alert.desc}</p>

                                    <div className="d-flex gap-3 small text-muted">
                                        <span>
                                            <strong>Event:</strong> {alert.event}
                                        </span>
                                        <span>
                                            <strong>Expires:</strong> {new Date(alert.expires).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedAlert(alert)
                                        setShowModal(true)
                                    }}
                                >
                                    Details
                                </Button>
                            </div>
                        </Alert>
                    ))}
                </Card.Body>
            </Card>

            {/* Alert Details Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {getSeverityIcon(selectedAlert?.severity || '')} {selectedAlert?.headline}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAlert && (
                        <div>
                            <div className="mb-3">
                                <div className="d-flex gap-2 mb-2">
                                    <Badge bg={getSeverityColor(selectedAlert.severity)}>
                                        {selectedAlert.severity}
                                    </Badge>
                                    {getUrgencyBadge(selectedAlert.urgency)}
                                    <Badge bg="secondary">{selectedAlert.event}</Badge>
                                </div>
                            </div>

                            <div className="mb-3">
                                <strong>Description:</strong>
                                <p className="mt-1">{selectedAlert.desc}</p>
                            </div>

                            {selectedAlert.instruction && (
                                <Alert variant="warning">
                                    <strong>⚠️ Safety Instructions:</strong>
                                    <p className="mb-0 mt-2">{selectedAlert.instruction}</p>
                                </Alert>
                            )}

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <strong>Effective:</strong>
                                    <br />
                                    {new Date(selectedAlert.effective).toLocaleString()}
                                </div>
                                <div className="col-md-6">
                                    <strong>Expires:</strong>
                                    <br />
                                    {new Date(selectedAlert.expires).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
