export interface EconomicData {
  gdp: {
    value: number
    year: number
  } | null
  inflation: {
    value: number
    year: number
  } | null
  unemployment: {
    value: number
    year: number
  } | null
}

export async function getEconomicData(countryCode: string): Promise<EconomicData> {
  try {
    // Get GDP data
    const gdpRes = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.CD?date=2020:2023&per_page=1&format=json`,
      { next: { revalidate: 3600 } }
    )
    const gdpData = gdpRes.ok ? await gdpRes.json() : [null, []]
    
    // Get inflation data
    const inflationRes = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?date=2020:2023&per_page=1&format=json`,
      { next: { revalidate: 3600 } }
    )
    const inflationData = inflationRes.ok ? await inflationRes.json() : [null, []]
    
    // Get unemployment data
    const unemploymentRes = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode}/indicator/SL.UEM.TOTL.ZS?date=2020:2023&per_page=1&format=json`,
      { next: { revalidate: 3600 } }
    )
    const unemploymentData = unemploymentRes.ok ? await unemploymentRes.json() : [null, []]
    
    return {
      gdp: gdpData[1]?.[0] ? {
        value: gdpData[1][0].value,
        year: gdpData[1][0].date
      } : null,
      inflation: inflationData[1]?.[0] ? {
        value: inflationData[1][0].value,
        year: inflationData[1][0].date
      } : null,
      unemployment: unemploymentData[1]?.[0] ? {
        value: unemploymentData[1][0].value,
        year: unemploymentData[1][0].date
      } : null
    }
  } catch (error) {
    console.error('Error fetching economic data:', error)
    return {
      gdp: null,
      inflation: null,
      unemployment: null
    }
  }
}

