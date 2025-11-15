'use client'

import { Container, Row, Col, Card } from 'react-bootstrap'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Body className="d-flex justify-content-center p-4">
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
