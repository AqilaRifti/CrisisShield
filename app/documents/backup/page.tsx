'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'

export default function DocumentBackupPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    documentType: '',
    description: '',
    tags: '',
    encrypted: false,
    encryptionKeyHint: ''
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    async function fetchBusinessId() {
      const { data } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('clerk_id', user?.id)
        .single()
      
      if (data) {
        setBusinessId(data.id)
      }
    }
    
    if (user) {
      fetchBusinessId()
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !businessId) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Create FormData for API upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('documentType', formData.documentType)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('tags', formData.tags)
      uploadFormData.append('encrypted', formData.encrypted.toString())
      uploadFormData.append('encryptionKeyHint', formData.encryptionKeyHint || '')

      // Upload via API route
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setSuccess(`Document backed up successfully! IPFS Hash: ${result.ipfsHash}`)
      
      // Reset form
      setFormData({
        documentType: '',
        description: '',
        tags: '',
        encrypted: false,
        encryptionKeyHint: ''
      })
      setSelectedFile(null)
    } catch (err: any) {
      setError(err.message || 'Failed to backup document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">Backup Document to IPFS</h3>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Document Type *</Form.Label>
                  <Form.Select
                    required
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  >
                    <option value="">Select type...</option>
                    <option value="invoice">Invoice</option>
                    <option value="customer_list">Customer List</option>
                    <option value="inventory">Inventory</option>
                    <option value="contract">Contract</option>
                    <option value="certificate">Certificate</option>
                    <option value="financial_record">Financial Record</option>
                    <option value="insurance_policy">Insurance Policy</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>File *</Form.Label>
                  <Form.Control
                    type="file"
                    required
                    onChange={handleFileChange}
                  />
                  {selectedFile && (
                    <Form.Text className="text-muted">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this document"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tags (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., important, financial, legal"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Encrypt document"
                    checked={formData.encrypted}
                    onChange={(e) => setFormData({ ...formData, encrypted: e.target.checked })}
                  />
                  {formData.encrypted && (
                    <Form.Control
                      type="text"
                      className="mt-2"
                      value={formData.encryptionKeyHint}
                      onChange={(e) => setFormData({ ...formData, encryptionKeyHint: e.target.value })}
                      placeholder="Encryption key hint (to help you remember)"
                    />
                  )}
                </Form.Group>

                <Button variant="primary" type="submit" disabled={loading || !selectedFile}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Uploading...
                    </>
                  ) : (
                    'Backup to IPFS'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

