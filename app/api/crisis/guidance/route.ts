import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { generateAIResponse } from '@/lib/ai/cerebras'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { crisisEventId, businessId, message, context } = await req.json()

    // Get crisis event and business profile
    const { data: crisisEvent } = await supabase
      .from('crisis_events')
      .select('*, emergency_plans(*)')
      .eq('id', crisisEventId)
      .single()

    const { data: profile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', businessId)
      .single()

    const timeSinceStart = crisisEvent.started_at
      ? Math.floor((Date.now() - new Date(crisisEvent.started_at).getTime()) / (1000 * 60 * 60))
      : 0

    const systemPrompt = `You are CrisisAI Emergency Response Assistant. A crisis is ACTIVE.

Business: ${profile.business_name}
Crisis Type: ${context.crisisType}
Severity: ${context.severity}
Time since start: ${timeSinceStart} hours
Location: ${profile.city}, ${profile.country}

Current situation: ${crisisEvent.description || 'Ongoing crisis'}
Actions taken so far: ${JSON.stringify(context.actionsTaken || [])}
Emergency plan being followed: ${crisisEvent.emergency_plans?.[0]?.plan_name || 'None'}

Your role:
1. Provide IMMEDIATE, PRACTICAL guidance
2. Prioritize safety first, then business continuity
3. Guide through emergency plan step-by-step
4. Adapt recommendations based on real-time situation
5. Stay calm, clear, and actionable

Communication style:
- Short, urgent messages (2-3 sentences)
- Use numbered lists for actions
- Emphasize time-sensitive items
- Acknowledge emotional stress
- Be specific and actionable

Respond to the user's message with immediate guidance.`

    const aiResponse = await generateAIResponse(systemPrompt, message)

    return NextResponse.json({ success: true, response: aiResponse })
  } catch (error: any) {
    console.error('Error generating guidance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

