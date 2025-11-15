import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getWeatherData } from '@/lib/external-apis/weather'
import { getEconomicData } from '@/lib/external-apis/worldbank'
import { getCrisisNews } from '@/lib/external-apis/news'
import { generateAIResponseJson } from '@/lib/ai/cerebras'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await req.json()

    // Get business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', businessId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    // Fetch external data
    const [weatherData, economicData, newsData] = await Promise.all([
      profile.latitude && profile.longitude
        ? getWeatherData(profile.latitude, profile.longitude)
        : null,
      getEconomicData(profile.country),
      getCrisisNews(profile.country)
    ])

    // Generate AI analysis
    const systemPrompt = `You are CrisisAI, an expert disaster prediction and business resilience advisor.

Business Context:
- Name: ${profile.business_name}
- Type: ${profile.business_type}
- Location: ${profile.city}, ${profile.country}
- Coordinates: ${profile.latitude}, ${profile.longitude}

Current Data Sources:
1. Weather Forecast: ${JSON.stringify(weatherData)}
2. Economic Indicators: ${JSON.stringify(economicData)}
3. Recent News: ${JSON.stringify(newsData)}

Your task:
1. Identify potential threats to this business in the next 30 days
2. Calculate probability (0-100%) for each threat
3. Assess severity (low/moderate/high/critical)
4. Provide specific, actionable recommendations

Consider:
- Geographic location and climate patterns
- Business type vulnerabilities (e.g., restaurants affected by food supply disruptions)
- Regional economic conditions
- Historical crisis patterns in this area

Return JSON format:
{
  "threats": [{
    "type": "flood",
    "title": "Heavy Rainfall Flooding Risk",
    "description": "...",
    "probability": 75,
    "severity": "high",
    "predicted_date": "2025-11-15",
    "recommendations": ["...", "..."]
  }],
  "overall_risk_score": 68,
  "priority_action": "..."
}`

    const aiAnalysis = await generateAIResponseJson(systemPrompt, 'Analyze threats for this business.')

    // Save threats to database
    if (aiAnalysis.threats && Array.isArray(aiAnalysis.threats)) {
      for (const threat of aiAnalysis.threats) {
        await supabase.from('crisis_threats').insert({
          business_id: businessId,
          threat_type: threat.type,
          severity: threat.severity,
          probability: threat.probability,
          title: threat.title,
          description: threat.description,
          predicted_date: threat.predicted_date,
          data_sources: {
            weather: weatherData,
            economic: economicData,
            news: newsData
          },
          ai_analysis: JSON.stringify(threat.recommendations)
        })
      }
    }

    return NextResponse.json({ success: true, analysis: aiAnalysis })
  } catch (error: any) {
    console.error('Error analyzing threats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

