import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const threatId = params.id
    const updates = await request.json()

    // Verify the threat belongs to the user's business
    const { data: threat } = await supabase
      .from('crisis_threats')
      .select('business_id, business_profiles!inner(clerk_id)')
      .eq('id', threatId)
      .single()

    const clerkId = Array.isArray(threat?.business_profiles)
      ? threat.business_profiles[0]?.clerk_id
      : (threat?.business_profiles as any)?.clerk_id

    if (!threat || clerkId !== user.id) {
      return NextResponse.json({ error: 'Threat not found' }, { status: 404 })
    }

    // Update the threat
    const { data, error } = await supabase
      .from('crisis_threats')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', threatId)
      .select()
      .single()

    if (error) {
      console.error('Threat update error:', error)
      return NextResponse.json({ error: 'Failed to update threat' }, { status: 500 })
    }

    return NextResponse.json({ success: true, threat: data })

  } catch (error) {
    console.error('Threat update error:', error)
    return NextResponse.json(
      { error: 'Failed to update threat' },
      { status: 500 }
    )
  }
}