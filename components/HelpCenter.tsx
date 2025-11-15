'use client'

import { useState } from 'react'
import { Card, Row, Col, Accordion, Badge, Button, Modal, Form, Alert } from 'react-bootstrap'

interface HelpArticle {
    id: string
    title: string
    category: string
    content: string
    tags: string[]
}

const HELP_ARTICLES: HelpArticle[] = [
    {
        id: '1',
        title: 'Getting Started with CrisisShield',
        category: 'Getting Started',
        content: `
      Welcome to CrisisShield! This guide will help you get started:
      
      1. **Complete Your Profile**: Fill out your business information in the onboarding process
      2. **Review Threats**: Check the threats dashboard for potential risks to your business
      3. **Create Emergency Plans**: Develop comprehensive crisis response plans
      4. **Set Up Alerts**: Configure notification preferences for real-time updates
      5. **Explore Funding**: Browse available funding opportunities for crisis recovery
      
      Your dashboard provides a comprehensive overview of your business's crisis preparedness status.
    `,
        tags: ['onboarding', 'setup', 'dashboard']
    },
    {
        id: '2',
        title: 'Understanding Threat Levels',
        category: 'Threat Management',
        content: `
      CrisisShield uses four threat severity levels:
      
      **Critical (Red)**: Immediate action required. High probability of occurrence with severe impact.
      **High (Orange)**: Urgent attention needed. Significant risk that requires prompt response.
      **Moderate (Blue)**: Monitor closely. Moderate risk that should be tracked and prepared for.
      **Low (Green)**: Awareness level. Minor risk that requires basic preparedness.
      
      Threat probability is calculated using AI analysis of multiple data sources including weather patterns, economic indicators, and regional risk factors.
    `,
        tags: ['threats', 'severity', 'risk-assessment']
    },
    {
        id: '3',
        title: 'Creating Effective Emergency Plans',
        category: 'Emergency Planning',
        content: `
      A comprehensive emergency plan should include:
      
      **Pre-Crisis Actions**:
      - Risk assessment and mitigation strategies
      - Insurance coverage review
      - Staff training and communication protocols
      - Resource stockpiling and backup systems
      
      **During-Crisis Actions**:
      - Immediate safety procedures
      - Communication with stakeholders
      - Damage assessment protocols
      - Emergency resource deployment
      
      **Post-Crisis Actions**:
      - Recovery and restoration procedures
      - Business continuity measures
      - Lessons learned documentation
      - Insurance claims processing
      
      Regularly review and update your plans based on changing circumstances.
    `,
        tags: ['emergency-plans', 'preparedness', 'business-continuity']
    },
    {
        id: '4',
        title: 'Recovery Progress Tracking',
        category: 'Recovery Management',
        content: `
      Track your recovery progress through six stages:
      
      1. **Assessment**: Evaluate damage and immediate needs
      2. **Cleanup**: Clear debris and secure premises
      3. **Rebuilding**: Repair infrastructure and systems
      4. **Reopening**: Resume limited operations
      5. **Stabilization**: Return to normal operations
      6. **Complete**: Full recovery achieved
      
      Monitor operational capacity and revenue recovery percentages to gauge progress. Set milestones to track achievements and maintain momentum during recovery.
    `,
        tags: ['recovery', 'tracking', 'milestones']
    },
    {
        id: '5',
        title: 'Funding Opportunities Guide',
        category: 'Funding',
        content: `
      Types of funding available:
      
      **Grants**: Non-repayable funds typically for specific purposes
      **Loans**: Repayable funding with various terms and interest rates
      **Subsidies**: Government support to reduce business costs
      **Tax Relief**: Temporary or permanent tax reductions
      
      **Application Tips**:
      - Read eligibility requirements carefully
      - Prepare required documentation in advance
      - Apply early - many opportunities have limited funding
      - Follow up on application status
      - Keep detailed records of all applications
    `,
        tags: ['funding', 'grants', 'loans', 'applications']
    },
    {
        id: '6',
        title: 'Generating and Using Threat Reports',
        category: 'Reports & Analytics',
        content: `
      Threat reports provide comprehensive analysis of your business risks:
      
      **Report Types**:
      - Comprehensive: Full analysis with recommendations
      - Executive Summary: High-level overview for leadership
      - Technical: Detailed technical analysis for specialists
      
      **Using Reports**:
      - Share with stakeholders and insurance providers
      - Use for strategic planning and resource allocation
      - Include in board presentations and compliance documentation
      - Update emergency plans based on findings
      
      Generate reports regularly to track risk trends over time.
    `,
        tags: ['reports', 'analytics', 'documentation']
    }
]

const CATEGORIES = ['All', 'Getting Started', 'Threat Management', 'Emergency Planning', 'Recovery Management', 'Funding', 'Reports & Analytics']

export default function HelpCenter() {
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [showContactModal, setShowContactModal] = useState(false)
    const [contactForm, setContactForm] = useState({
        subject: '',
        message: '',
        priority: 'medium'
    })

    const filteredArticles = HELP_ARTICLES.filter(article => {
        const categoryMatch = selectedCategory === 'All' || article.category === selectedCategory
        const searchMatch = !searchQuery ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        return categoryMatch && searchMatch
    })

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // In a real app, this would send the message to support
        alert('Support request submitted! We\'ll get back to you within 24 hours.')
        setShowContactModal(false)
        setContactForm({ subject: '', message: '', priority: 'medium' })
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Help Center</h5>
                <Button variant="primary" onClick={() => setShowContactModal(true)}>
                    Contact Support
                </Button>
            </div>

            {/* Search and Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={8}>
                            <Form.Control
                                type="text"
                                placeholder="Search help articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {CATEGORIES.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Quick Links */}
            <Card className="mb-4">
                <Card.Header>Quick Links</Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Button variant="outline-primary" className="w-100 mb-2" size="sm">
                                Video Tutorials
                            </Button>
                        </Col>
                        <Col md={3}>
                            <Button variant="outline-info" className="w-100 mb-2" size="sm">
                                System Status
                            </Button>
                        </Col>
                        <Col md={3}>
                            <Button variant="outline-success" className="w-100 mb-2" size="sm">
                                Feature Requests
                            </Button>
                        </Col>
                        <Col md={3}>
                            <Button variant="outline-warning" className="w-100 mb-2" size="sm">
                                Report Bug
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Help Articles */}
            {filteredArticles.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-4">
                        <p className="text-muted">No articles found matching your search.</p>
                        <Button variant="outline-primary" onClick={() => {
                            setSearchQuery('')
                            setSelectedCategory('All')
                        }}>
                            Clear Filters
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Accordion>
                    {filteredArticles.map((article, index) => (
                        <Accordion.Item key={article.id} eventKey={index.toString()}>
                            <Accordion.Header>
                                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                    <span>{article.title}</span>
                                    <div className="d-flex gap-2">
                                        <Badge bg="secondary">{article.category}</Badge>
                                        {article.tags.slice(0, 2).map(tag => (
                                            <Badge key={tag} bg="light" text="dark">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </Accordion.Header>
                            <Accordion.Body>
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {article.content}
                                </div>
                                <div className="mt-3">
                                    <strong>Tags:</strong>{' '}
                                    {article.tags.map(tag => (
                                        <Badge key={tag} bg="light" text="dark" className="me-1">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            )}

            {/* Contact Support Modal */}
            <Modal show={showContactModal} onHide={() => setShowContactModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Contact Support</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleContactSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Priority</Form.Label>
                            <Form.Select
                                value={contactForm.priority}
                                onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                            >
                                <option value="low">Low - General question</option>
                                <option value="medium">Medium - Feature request</option>
                                <option value="high">High - Technical issue</option>
                                <option value="urgent">Urgent - System down</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Subject</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={contactForm.subject}
                                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                placeholder="Brief description of your issue"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Message</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                required
                                value={contactForm.message}
                                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                placeholder="Detailed description of your issue or question"
                            />
                        </Form.Group>

                        <Alert variant="info">
                            <small>
                                <strong>Response Times:</strong><br />
                                • Urgent: Within 2 hours<br />
                                • High: Within 8 hours<br />
                                • Medium: Within 24 hours<br />
                                • Low: Within 48 hours
                            </small>
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowContactModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleContactSubmit}>
                        Submit Request
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}