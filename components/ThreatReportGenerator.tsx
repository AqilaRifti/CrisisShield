'use client'

import { useState } from 'react'
import { Card, Form, Button, Modal, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap'

interface ThreatReport {
    id: string
    generated_at: string
    business_name: string
    report_type: string
    timeframe_days: number
    summary: {
        total_threats: number
        active_threats: number
        critical_threats: number
        occurred_crises: number
        avg_threat_probability: number
    }
    threats_by_type: Record<string, number>
    threats_by_severity: Record<string, number>
    timeline: any[]
    recommendations: string[]
}

interface Props {
    onReportGenerated?: (report: ThreatReport) => void
}

export default function ThreatReportGenerator({ onReportGenerated }: Props) {
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [report, setReport] = useState<ThreatReport | null>(null)
    const [config, setConfig] = useState({
        reportType: 'comprehensive',
        timeframe: '30',
        includeRecommendations: true
    })

    const generateReport = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/threats/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })

            if (!response.ok) {
                throw new Error('Failed to generate report')
            }

            const data = await response.json()
            setReport(data.report)
            onReportGenerated?.(data.report)
        } catch (err: any) {
            setError(err.message || 'Failed to generate report')
        } finally {
            setLoading(false)
        }
    }

    const downloadReport = () => {
        if (!report) return

        const dataStr = JSON.stringify(report, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `threat-report-${report.id}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'danger'
            case 'high': return 'warning'
            case 'moderate': return 'info'
            case 'low': return 'success'
            default: return 'secondary'
        }
    }

    return (
        <>
            <Button
                variant="primary"
                onClick={() => setShow(true)}
                className="d-flex align-items-center gap-2"
            >
                <i className="bi bi-file-earmark-text"></i>
                Generate Threats Report
            </Button>

            <Modal show={show} onHide={() => setShow(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Generate Threats Report</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!report ? (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Report Type</Form.Label>
                                <Form.Select
                                    value={config.reportType}
                                    onChange={(e) => setConfig({ ...config, reportType: e.target.value })}
                                >
                                    <option value="comprehensive">Comprehensive Analysis</option>
                                    <option value="summary">Executive Summary</option>
                                    <option value="technical">Technical Details</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Time Period</Form.Label>
                                <Form.Select
                                    value={config.timeframe}
                                    onChange={(e) => setConfig({ ...config, timeframe: e.target.value })}
                                >
                                    <option value="7">Last 7 days</option>
                                    <option value="30">Last 30 days</option>
                                    <option value="90">Last 90 days</option>
                                    <option value="365">Last year</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Include AI Recommendations"
                                    checked={config.includeRecommendations}
                                    onChange={(e) => setConfig({ ...config, includeRecommendations: e.target.checked })}
                                />
                            </Form.Group>

                            {error && <Alert variant="danger">{error}</Alert>}
                        </Form>
                    ) : (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5>Threat Analysis Report</h5>
                                <Badge bg="info">
                                    {new Date(report.generated_at).toLocaleString()}
                                </Badge>
                            </div>

                            <Row className="mb-4">
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h3 className="text-primary">{report.summary.total_threats}</h3>
                                            <small>Total Threats</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h3 className="text-warning">{report.summary.active_threats}</h3>
                                            <small>Active Threats</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h3 className="text-danger">{report.summary.critical_threats}</h3>
                                            <small>Critical Threats</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h3 className="text-info">{report.summary.avg_threat_probability}%</h3>
                                            <small>Avg Probability</small>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Card className="mb-3">
                                <Card.Header>Threats by Severity</Card.Header>
                                <Card.Body>
                                    <div className="d-flex flex-wrap gap-2">
                                        {Object.entries(report.threats_by_severity).map(([severity, count]) => (
                                            <Badge key={severity} bg={getSeverityColor(severity)} className="p-2">
                                                {severity.toUpperCase()}: {count}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>

                            <Card className="mb-3">
                                <Card.Header>Threats by Type</Card.Header>
                                <Card.Body>
                                    <div className="d-flex flex-wrap gap-2">
                                        {Object.entries(report.threats_by_type).map(([type, count]) => (
                                            <Badge key={type} bg="secondary" className="p-2">
                                                {type}: {count}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>

                            {report.recommendations.length > 0 && (
                                <Card>
                                    <Card.Header>AI Recommendations</Card.Header>
                                    <Card.Body>
                                        <ul className="mb-0">
                                            {report.recommendations.map((rec, idx) => (
                                                <li key={idx} className={rec.includes('URGENT') ? 'text-danger fw-bold' : ''}>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!report ? (
                        <>
                            <Button variant="secondary" onClick={() => setShow(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={generateReport}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate Report'
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline-primary" onClick={downloadReport}>
                                Download JSON
                            </Button>
                            <Button variant="secondary" onClick={() => {
                                setReport(null)
                                setShow(false)
                            }}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={() => {
                                setReport(null)
                            }}>
                                Generate New Report
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>
        </>
    )
}