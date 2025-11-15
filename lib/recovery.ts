export type PlanAction = {
  action: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  estimated_cost?: number
  time_required?: string
  responsible_party?: string
  completed?: boolean
}

export type EmergencyPlan = {
  id: string
  plan_name: string
  plan_type: string
  pre_crisis_actions?: PlanAction[]
  during_crisis_actions?: PlanAction[]
  post_crisis_actions?: PlanAction[]
  required_resources?: Record<string, any>
  estimated_cost?: number
}

export function computeActionCompletionPercent(plan: EmergencyPlan | null): number {
  if (!plan) return 0
  const lists: PlanAction[][] = [
    plan.pre_crisis_actions || [],
    plan.during_crisis_actions || [],
    plan.post_crisis_actions || []
  ]
  const actions = lists.flat()
  if (actions.length === 0) return 0
  const completed = actions.filter(a => !!a.completed).length
  return Math.round((completed / actions.length) * 100)
}

export function deriveNextActions(plan: EmergencyPlan | null, limit = 5): string[] {
  if (!plan) return []
  const lists: PlanAction[][] = [
    plan.during_crisis_actions || [],
    plan.post_crisis_actions || [],
    plan.pre_crisis_actions || []
  ]
  const outstanding = lists.flat().filter(a => !a.completed)
  // Prioritize by declared priority
  const order = { critical: 0, high: 1, medium: 2, low: 3 } as const
  outstanding.sort((a, b) => (order[a.priority || 'low'] - order[b.priority || 'low']))
  return outstanding.slice(0, limit).map(a => a.action)
}

export function estimateOperationalCapacityFromPlan(plan: EmergencyPlan | null): number {
  // Heuristic: capacity tracks completion of during+post actions more heavily
  if (!plan) return 0
  const during = (plan.during_crisis_actions || [])
  const post = (plan.post_crisis_actions || [])
  const pre = (plan.pre_crisis_actions || [])
  const totalWeighted = during.length * 2 + post.length * 2 + pre.length
  if (totalWeighted === 0) return 0
  const completedWeighted =
    during.filter(a => a.completed).length * 2 +
    post.filter(a => a.completed).length * 2 +
    pre.filter(a => a.completed).length
  return Math.min(100, Math.round((completedWeighted / totalWeighted) * 100))
}

