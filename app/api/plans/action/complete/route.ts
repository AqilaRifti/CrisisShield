import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { computeActionCompletionPercent, deriveNextActions, estimateOperationalCapacityFromPlan } from '@/lib/recovery'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId, phase, index, completed } = await req.json()
    if (!planId || !phase || typeof index !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Load plan and verify ownership via business id
    const { data: plan } = await supabase
      .from('emergency_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (!profile || plan.business_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const field = phase === 'pre' ? 'pre_crisis_actions'
      : phase === 'during' ? 'during_crisis_actions'
      : 'post_crisis_actions'

    const actions = (plan[field] || []) as any[]
    if (index < 0 || index >= actions.length) {
      return NextResponse.json({ error: 'Index out of range' }, { status: 400 })
    }

    actions[index] = { ...(actions[index] || {}), completed: !!completed }

    const updatePayload: any = {}
    updatePayload[field] = actions

    const { data: updatedPlan, error: updateErr } = await supabase
      .from('emergency_plans')
      .update(updatePayload)
      .eq('id', planId)
      .select('*')
      .single()

    if (updateErr) throw updateErr

    // If a crisis event uses this plan, update its recovery record if exists
    const { data: crisis } = await supabase
      .from('crisis_events')
      .select('id, business_id')
      .eq('emergency_plan_id', planId)
      .maybeSingle()

    if (crisis) {
      const { data: recovery } = await supabase
        .from('recovery_progress')
        .select('*')
        .eq('crisis_event_id', crisis.id)
        .maybeSingle()

      const completion = computeActionCompletionPercent(updatedPlan as any)
      const opCapacity = estimateOperationalCapacityFromPlan(updatedPlan as any)
      const next = deriveNextActions(updatedPlan as any)

      if (recovery) {
        await supabase
          .from('recovery_progress')
          .update({
            operational_capacity_percent: opCapacity,
            next_actions: next
          })
          .eq('id', recovery.id)
      } else {
        await supabase
          .from('recovery_progress')
          .insert({
            business_id: crisis.business_id,
            crisis_event_id: crisis.id,
            recovery_stage: 'assessment',
            operational_capacity_percent: opCapacity,
            revenue_recovery_percent: 0,
            next_actions: next
          })
      }
    }

    return NextResponse.json({ success: true, plan: updatedPlan })
  } catch (e: any) {
    console.error('Plan action complete error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

