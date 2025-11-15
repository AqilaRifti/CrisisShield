'use client'

import { Container, Row, Col, Button } from 'react-bootstrap'
import Link from 'next/link'
import HelpCenter from '@/components/HelpCenter'

export default function HelpPage() {
    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col className="d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="display-5">Help & Support</h1>
                        <p className="text-muted">Find answers to common questions and get support</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline-secondary">Back to Dashboard</Button>
                    </Link>
                </Col>
            </Row>

            <HelpCenter />
        </Container>
    )
}