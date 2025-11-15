'use client'

import { Container, Row, Col, Card } from 'react-bootstrap'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Body className="d-flex justify-content-center p-4">
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
