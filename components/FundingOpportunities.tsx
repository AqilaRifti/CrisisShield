'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Badge, Button, Form, Modal, Alert, InputGroup } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'

interface FundingOpportunity {
    id: string
    title: string
    provider: string
    opportunity_type: string
    description: string
    min_amount: number
    max_amount: number
    deadline?: string
    application_url?: string
    eligible_countries: string[]
    eligible_crisis_types: string[]
    requirements: string[]
    active: boolean
}

interface Props {
    businessProfile: any
}

export default function FundingOpportunities({ businessProfile }: Props) {
    const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([])
    const [filteredOpportunities, setFilteredOpportunities] = useState<FundingOpportunity[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedOpportunity, setSelectedOpportunity] = useState<FundingOpportunity | null>(null)
    const [filters, setFilters] = useState({
        type: 'all',
        minAmount: '',
        maxAmount: '',
        search: ''
    })

    useEffect(() => {
        loadOpportunities()
    }, [businessProfile])

    useEffect(() => {
        applyFilters()
    }, [opportunities, filters])

    const loadOpportunities = async () => {
        try {
            // Get active crisis types for the business
            const { data: activeCrises } = await supabase
                .from('crisis_events')
                .select('crisis_type')
                .eq('business_id', businessProfile?.id)
                .eq('status', 'active')

            const crisisTypes = activeCrises?.map(c => c.crisis_type) || []

            // Load all funding opportunities
            const { data: allOpps } = await supabase
                .from('funding_opportunities')
                .select('*')
                .eq('active', true)
                .order('deadline', { ascending: true, nullsFirst: false })

            if (allOpps) {
                // Filter opportunities based on eligibility
                const eligible = allOpps.filter(opp => {
                    const countryMatch = !opp.eligible_countries?.length ||
                        opp.eligible_countries.includes(businessProfile?.country)

                    const crisisMatch = !opp.eligible_crisis_types?.length ||
                        !crisisTypes.length ||
                        crisisTypes.some(type => opp.eligible_crisis_types.includes(type))

                    return countryMatch && crisisMatch
                })

                setOpportunities(eligible)
            }
        } catch (error) {
            console.error('Failed to load funding opportunities:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = [...opportunities]

        // Type filter
        if (filters.type !== 'all') {
            filtered = filtered.filter(opp => opp.opportunity_type === filters.type)
        }

        // Amount filters
        if (filters.minAmount) {
            const minAmount = parseInt(filters.minAmount)
            filtered = filtered.filter(opp => opp.max_amount >= minAmount)
        }

        if (filters.maxAmount) {
            const maxAmount = parseInt(filters.maxAmount)
            filtered = filtered.filter(opp => opp.min_amount <= maxAmount)
        }

        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase()
            filtered = filtered.filter(opp =>
                opp.title.toLowerCase().includes(search) ||
                opp.provider.toLowerCase().includes(search) ||
                opp.description.toLowerCase().includes(search)
            )
        }

        setFilteredOpportunities(filtered)
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'grant': return 'success'
            case 'loan': return 'primary'
            case 'subsidy': return 'info'
            case 'tax_relief': return 'warning'
            default: return 'secondary'
        }
    }

    const isDeadlineSoon = (deadline?: string) => {
        if (!deadline) return false
        const deadlineDate = new Date(deadline)
        const now = new Date()
        const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil <= 30 && daysUntil > 0
    }

    const isDeadlinePassed = (deadline?: string) => {
        if (!deadline) return false
        return new Date(deadline) < new Date()
    }

    if (loading) return <Card><Card.Body>Loading funding opportunities...</Card.Body></Card>

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Funding Opportunities</h5>
                <Badge bg="info">{filteredOpportunities.length} Available</Badge>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Header>Filter Opportunities</Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Type</Form.Label>
                                <Form.Select
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                >
                                    <option value="all">All Types</option>
                                    <option value="grant">Grants</option>
                                    <option value="loan">Loans</option>
                                    <option value="subsidy">Subsidies</option>
                                    <option value="tax_relief">Tax Relief</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Min Amount ($)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={filters.minAmount}
                                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                                    placeholder="0"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Max Amount ($)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={filters.maxAmount}
                                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                                    placeholder="No limit"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Search</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    placeholder="Search opportunities..."
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {filteredOpportunities.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-4">
                        <p className="text-muted">
                            {opportunities.length === 0
                                ? 'No funding opportunities available at this time'
                                : 'No opportunities match your current filters'
                            }
                        </p>
                        {filters.type !== 'all' || filters.search || filters.minAmount || filters.maxAmount ? (
                            <Button
                                variant="outline-primary"
                                onClick={() => setFilters({ type: 'all', minAmount: '', maxAmount: '', search: '' })}
                            >
                                Clear Filters
                            </Button>
                        ) : null}
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {filteredOpportunities.map((opp) => {
                        const deadlineSoon = isDeadlineSoon(opp.deadline)
                        const deadlinePassed = isDeadlinePassed(opp.deadline)

                        return (
                            <Col md={6} key={opp.id} className="mb-4">
                                <Card className={`h-100 shadow-sm ${deadlineSoon ? 'border-warning' : ''} ${deadlinePassed ? 'border-danger' : ''}`}>
                                    <Card.Header className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h6 className="mb-1">{opp.title}</h6>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Badge bg={getTypeColor(opp.opportunity_type)}>
                                                    {opp.opportunity_type.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                                {deadlineSoon && <Badge bg="warning">Deadline Soon</Badge>}
                                                {deadlinePassed && <Badge bg="danger">Deadline Passed</Badge>}
                                            </div>
                                        </div>
                                    </Card.Header>

                                    <Card.Body>
                                        <p className="small text-muted mb-2">{opp.description}</p>

                                        <div className="mb-2">
                                            <strong>Provider:</strong> {opp.provider}
                                        </div>

                                        <div className="mb-2">
                                            <strong>Amount:</strong> ${opp.min_amount?.toLocaleString()} - ${opp.max_amount?.toLocaleString()}
                                        </div>

                                        {opp.deadline && (
                                            <div className="mb-2">
                                                <strong>Deadline:</strong>{' '}
                                                <span className={deadlineSoon ? 'text-warning fw-bold' : deadlinePassed ? 'text-danger fw-bold' : ''}>
                                                    {new Date(opp.deadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}

                                        {opp.eligible_crisis_types?.length > 0 && (
                                            <div className="mb-2">
                                                <strong>Eligible for:</strong>
                                                <div className="mt-1">
                                                    {opp.eligible_crisis_types.map(type => (
                                                        <Badge key={type} bg="secondary" className="me-1 mb-1">
                                                            {type.replace('_', ' ')}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>

                                    <Card.Footer className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedOpportunity(opp)
                                                setShowModal(true)
                                            }}
                                        >
                                            View Details
                                        </Button>

                                        {opp.application_url && !deadlinePassed ? (
                                            <Button
                                                variant="success"
                                                size="sm"
                                                href={opp.application_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Apply Now
                                            </Button>
                                        ) : (
                                            <Button variant="outline-secondary" size="sm" disabled>
                                                {deadlinePassed ? 'Deadline Passed' : 'Application Coming Soon'}
                                            </Button>
                                        )}
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            )}

            {/* Opportunity Details Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedOpportunity?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOpportunity && (
                        <div>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Provider:</strong> {selectedOpportunity.provider}
                                </Col>
                                <Col md={6}>
                                    <strong>Type:</strong>{' '}
                                    <Badge bg={getTypeColor(selectedOpportunity.opportunity_type)}>
                                        {selectedOpportunity.opportunity_type.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Amount Range:</strong> ${selectedOpportunity.min_amount?.toLocaleString()} - ${selectedOpportunity.max_amount?.toLocaleString()}
                                </Col>
                                <Col md={6}>
                                    {selectedOpportunity.deadline && (
                                        <>
                                            <strong>Deadline:</strong>{' '}
                                            <span className={isDeadlineSoon(selectedOpportunity.deadline) ? 'text-warning fw-bold' : ''}>
                                                {new Date(selectedOpportunity.deadline).toLocaleDateString()}
                                            </span>
                                        </>
                                    )}
                                </Col>
                            </Row>

                            <div className="mb-3">
                                <strong>Description:</strong>
                                <p className="mt-1">{selectedOpportunity.description}</p>
                            </div>

                            {selectedOpportunity.requirements?.length > 0 && (
                                <div className="mb-3">
                                    <strong>Requirements:</strong>
                                    <ul className="mt-1">
                                        {selectedOpportunity.requirements.map((req, idx) => (
                                            <li key={idx}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedOpportunity.eligible_countries?.length > 0 && (
                                <div className="mb-3">
                                    <strong>Eligible Countries:</strong>
                                    <div className="mt-1">
                                        {selectedOpportunity.eligible_countries.map(country => (
                                            <Badge key={country} bg="light" text="dark" className="me-1">
                                                {country}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedOpportunity.eligible_crisis_types?.length > 0 && (
                                <div className="mb-3">
                                    <strong>Eligible Crisis Types:</strong>
                                    <div className="mt-1">
                                        {selectedOpportunity.eligible_crisis_types.map(type => (
                                            <Badge key={type} bg="secondary" className="me-1">
                                                {type.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isDeadlineSoon(selectedOpportunity.deadline) && (
                                <Alert variant="warning">
                                    <strong>Deadline Approaching!</strong> This opportunity's deadline is within 30 days.
                                </Alert>
                            )}

                            {isDeadlinePassed(selectedOpportunity.deadline) && (
                                <Alert variant="danger">
                                    <strong>Deadline Passed!</strong> This opportunity is no longer accepting applications.
                                </Alert>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    {selectedOpportunity?.application_url && !isDeadlinePassed(selectedOpportunity.deadline) && (
                        <Button
                            variant="success"
                            href={selectedOpportunity.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Apply Now
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    )
}