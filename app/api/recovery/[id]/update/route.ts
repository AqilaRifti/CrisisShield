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
    const recoveryId = params.id
    const updates = await request.json()

    // Verify the recovery belongs to the user's business
    const { data: recovery } = await supabase
      .from('recovery_progress')
      .select('business_id, business_profiles!inner(clerk_id)')
      .eq('id', recoveryId)
      .single()

    if (!recovery || recovery.business_profiles.clerk_id !== user.id) {
      return NextResponse.json({ error: 'Recovery not found' }, { status: 404 })
    }

    // Update the recovery progress
    const { data, error } = await supabase
      .from('recovery_progress')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', recoveryId)
      .select()
      .single()

    if (error) {
      console.error('Recovery update error:', error)
      return NextResponse.json({ error: 'Failed to update recovery' }, { status: 500 })
    }

    return NextResponse.json({ success: true, recovery: data })

  } catch (error) {
    console.error('Recovery update error:', error)
    return NextResponse.json(
      { error: 'Failed to update recovery' },
      { status: 500 }
    )
  }
}