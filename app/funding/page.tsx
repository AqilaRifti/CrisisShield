"use client"

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import FundingOpportunities from '@/components/FundingOpportunities'

export default function FundingPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const { data: prof } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('clerk_id', user.id)
          .single()

        setProfile(prof)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (!user) return null

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-5">Funding Opportunities</h1>
            <p className="text-muted">Find relief grants and loans for your business</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline-secondary">Back to Dashboard</Button>
          </Link>
        </Col>
      </Row>

      {loading ? (
        <Card><Card.Body>Loading...</Card.Body></Card>
      ) : !profile ? (
        <Alert variant="warning">Business profile not found. Please complete your profile setup.</Alert>
      ) : (
        <FundingOpportunities businessProfile={profile} />
      )}
    </Container>
  )
}

