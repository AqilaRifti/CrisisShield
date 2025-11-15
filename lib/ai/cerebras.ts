import Cerebras from '@cerebras/cerebras_cloud_sdk'

// Load balanced API keys
const API_KEYS = [
  'csk-c9ddc69fd3pk9jj3py24jmhydft6c2ymmdk59tyt6em6derk',
  'csk-nrtfnn56xmvkyckdt9nwn3rh8ef8vwx9xxktvxwmk6yxw566',
  'csk-hrtwc24p9mtw48m4dmvf95j4xx539nth4y63wxympjhkdhfp',
  'csk-4r22m82n6pve9ywhd9hkpdneek6t52keethr5dn66jpw6fyw',
  'csk-wp589vwjn2hfhnxhv9rwyj54tnpexc6yfxev5en9x6ffej5m',
  'csk-6232phepe8nxn25vrwjenf2p9mpke9txvw6pjjd6jx8reh2n',
  'csk-4f9vfnrkmd898h5dyr98y8j2ftnjhvhee322mvy8tmhnfthh',
  'csk-mennk8jmdnxptr4r56xv9mc95t9vwjpwhhnr54jhp4382wjt'
]

let currentKeyIndex = 0

export function getCerebrasClient() {
  const apiKey = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return new Cerebras({ apiKey })
}

export async function generateAIResponse(systemPrompt: string, userMessage: string) {
  const cerebras = getCerebrasClient()
  
  const response = await cerebras.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    model: 'qwen-3-235b-a22b-thinking-2507',
    stream: false,
    max_completion_tokens: 65536,
    temperature: 0.6,
    top_p: 0.95
  })
  
  return response.choices[0]?.message?.content.replace(/^[\s\S]*?<\/think>/, '')
}

export async function generateAIResponseJson(systemPrompt: string, userMessage: string) {
  const content = await generateAIResponse(systemPrompt, userMessage)
  try {
    return JSON.parse(content || '{}')
  } catch {
    // Try to extract JSON if wrapped in markdown
    const jsonMatch = content?.match(/```json\n([\s\S]*?)\n```/) || content?.match(/```\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1])
    }
    return {}
  }
}

