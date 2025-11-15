import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { uploadToIPFS } from '@/lib/external-apis/ipfs'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string
    const encrypted = formData.get('encrypted') === 'true'
    const encryptionKeyHint = formData.get('encryptionKeyHint') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get business profile
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to IPFS
    const ipfsResult = await uploadToIPFS(buffer, file.name)

    // Save to database
    const { error: dbError } = await supabase
      .from('document_backups')
      .insert({
        business_id: profile.id,
        document_type: documentType,
        file_name: file.name,
        file_size_bytes: file.size,
        ipfs_hash: ipfsResult.ipfsHash,
        ipfs_url: ipfsResult.ipfsUrl,
        encrypted: encrypted,
        encryption_key_hint: encryptionKeyHint || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        description: description || null
      })

    if (dbError) {
      throw dbError
    }

    return NextResponse.json({ 
      success: true, 
      ipfsHash: ipfsResult.ipfsHash,
      ipfsUrl: ipfsResult.ipfsUrl
    })
  } catch (error: any) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

