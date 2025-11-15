'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Navbar, Nav, Container, Badge } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navigation() {
  const { isSignedIn, user } = useUser()
  const [activeCrises, setActiveCrises] = useState(0)
  const [criticalThreats, setCriticalThreats] = useState(0)

  useEffect(() => {
    if (!user) return

    const loadAlerts = async () => {
      try {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        if (profile?.id) {
          const [{ data: crises }, { data: threats }] = await Promise.all([
            supabase
              .from('crisis_events')
              .select('id')
              .eq('business_id', profile.id)
              .eq('status', 'active'),
            supabase
              .from('crisis_threats')
              .select('id')
              .eq('business_id', profile.id)
              .eq('status', 'active')
              .eq('severity', 'critical')
          ])

          setActiveCrises(crises?.length || 0)
          setCriticalThreats(threats?.length || 0)
        }
      } catch (error) {
        console.error('Failed to load alerts:', error)
      }
    }

    loadAlerts()
    const interval = setInterval(loadAlerts, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [user])

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} href="/">
          🛡️ CrisisShield
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isSignedIn && (
              <>
                <Nav.Link as={Link} href="/dashboard">
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} href="/plans">
                  Emergency Plans
                </Nav.Link>
                <Nav.Link as={Link} href="/documents/backup">
                  Backup Documents
                </Nav.Link>
                <Nav.Link as={Link} href="/funding">
                  Funding
                </Nav.Link>
                <Nav.Link as={Link} href="/recovery">
                  Recovery
                  {activeCrises > 0 && (
                    <Badge bg="danger" className="ms-1">{activeCrises}</Badge>
                  )}
                </Nav.Link>
                <Nav.Link as={Link} href="/threats">
                  Threats
                  {criticalThreats > 0 && (
                    <Badge bg="warning" className="ms-1">{criticalThreats}</Badge>
                  )}
                </Nav.Link>
                <Nav.Link as={Link} href="/weather">
                  Weather
                </Nav.Link>
                <Nav.Link as={Link} href="/help">
                  Help
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <Nav.Link as={Link} href="/sign-in">
                  Sign In
                </Nav.Link>
                <Nav.Link as={Link} href="/sign-up">
                  Sign Up
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

