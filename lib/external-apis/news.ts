export interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

export async function getCrisisNews(countryCode: string, keywords: string[] = ['crisis', 'disaster', 'emergency']): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY!
  
  if (!apiKey) {
    console.warn('News API key not configured')
    return []
  }
  
  try {
    const query = keywords.join(' OR ')
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`,
      { next: { revalidate: 600 } } // Cache for 10 minutes
    )
    
    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return (data.articles || []).map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source.name
    }))
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

