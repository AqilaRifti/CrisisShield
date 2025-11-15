import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { generateAIResponseJson } from '@/lib/ai/cerebras'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, crisisType, planName, businessType, location, employeeCount, revenue, situationDescription } = await req.json()

    const systemPrompt = `You are an emergency management expert creating a crisis response plan.

Business Details:
- Type: ${businessType}
- Location: ${location}
- Employees: ${employeeCount || 'Not specified'}
- Annual Revenue: $${revenue || 'Not specified'}

Crisis Type: ${crisisType}

${situationDescription ? `Specific Situation Context:
${situationDescription}

Please take this context into account when creating the emergency plan. Address the specific vulnerabilities, concerns, and circumstances mentioned.

` : ''}Generate a comprehensive emergency plan with three phases:

1. PRE-CRISIS PREPARATION (Before crisis hits):
   - Specific actions to take now
   - Resources to acquire
   - Staff training needed
   - Timeline for completion

2. DURING CRISIS (Active response):
   - Immediate actions (first 24 hours)
   - Communication protocols
   - Safety procedures
   - Operational adjustments

3. POST-CRISIS RECOVERY:
   - Damage assessment steps
   - Reopening procedures
   - Financial recovery actions
   - Long-term resilience building

For each action, specify:
- Priority level (critical/high/medium/low)
- Estimated cost (if applicable)
- Time required
- Responsible party

Return in JSON format:
{
  "plan_name": "${planName}",
  "pre_crisis_actions": [
    {
      "action": "...",
      "priority": "high",
      "estimated_cost": 0,
      "time_required": "...",
      "responsible_party": "..."
    }
  ],
  "during_crisis_actions": [...],
  "post_crisis_actions": [...],
  "required_resources": {
    "equipment": ["..."],
    "supplies": ["..."],
    "personnel": ["..."]
  },
  "estimated_total_cost": 0
}`

    const plan = await generateAIResponseJson(systemPrompt, 'Generate the emergency plan.')

    return NextResponse.json({ success: true, plan })
  } catch (error: any) {
    console.error('Error generating plan:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

