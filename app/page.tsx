'use client'

import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  return (
    <Container fluid className="bg-light min-vh-100">
      <Container className="py-5">
        <Row className="align-items-center">
          <Col md={6}>
            <h1 className="display-4 fw-bold mb-4">
              🛡️ CrisisShield
            </h1>
            <p className="lead mb-4">
              Your AI-Powered Business Protection Platform.
              Predict threats, prepare emergency plans, and recover faster from any crisis.
            </p>
            {isSignedIn ? (
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            ) : (
              <div>
                <Link href="/sign-up">
                  <Button variant="primary" size="lg" className="me-2">
                    Get Started
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline-primary" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </Col>
          <Col md={6}>
            <Card className="shadow-lg">
              <Card.Body className="p-5">
                <h3 className="mb-4">Why CrisisShield?</h3>
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <strong>🎯 AI Threat Prediction</strong> - Anticipate floods, pandemics, economic crashes before they hit
                  </li>
                  <li className="mb-3">
                    <strong>📋 Smart Emergency Planning</strong> - AI-generated crisis response plans in minutes
                  </li>
                  <li className="mb-3">
                    <strong>💬 Real-Time Guidance</strong> - AI assistant during active crises
                  </li>
                  <li className="mb-3">
                    <strong>📊 Recovery Tracking</strong> - Monitor your business recovery progress
                  </li>
                  <li className="mb-3">
                    <strong>💰 Funding Opportunities</strong> - Find relief grants and loans automatically
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  )
}

