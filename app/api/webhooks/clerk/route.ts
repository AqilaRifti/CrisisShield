import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses } = evt.data
    
    // Create business profile placeholder (user completes in onboarding)
    try {
      await supabaseAdmin
        .from('business_profiles')
        .insert({
          clerk_id: id,
          email: email_addresses[0]?.email_address || '',
          business_name: 'My Business', // Placeholder
          business_type: 'retail', // Default
          country: 'ID' // Default
        })
    } catch (error) {
      console.error('Error creating business profile:', error)
    }
  }

  return new Response('Webhook processed', { status: 200 })
}

