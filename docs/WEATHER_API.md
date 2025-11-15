# 🌤️ Weather API Integration Guide

## Overview

CrisisShield uses **WeatherAPI.com** for real-time weather data, forecasts, and threat detection.

### API Key
- **Provider:** WeatherAPI.com
- **Free Tier:** 1 million calls/month
- **Documentation:** https://www.weatherapi.com/docs/

---

## Features

### 1. Current Weather
Get real-time weather conditions for any location.

```typescript
import { getCurrentWeather } from '@/lib/external-apis/weather'

const weather = await getCurrentWeather('Jakarta, Indonesia')
console.log(weather.current.temp_c) // Temperature in Celsius
console.log(weather.current.condition.text) // Weather condition
```

### 2. Weather Forecast
Get up to 14-day weather forecast with hourly data.

```typescript
import { getWeatherForecast } from '@/lib/external-apis/weather'

const forecast = await getWeatherForecast('Manila, Philippines', 7)
forecast.forecast.forecastday.forEach(day => {
  console.log(day.date, day.day.maxtemp_c, day.day.condition.text)
})
```

### 3. Weather Alerts
Get active weather alerts and warnings.

```typescript
import { getWeatherAlerts } from '@/lib/external-apis/weather'

const alerts = await getWeatherAlerts('Mumbai, India')
alerts?.forEach(alert => {
  console.log(alert.headline)
  console.log(alert.severity)
  console.log(alert.desc)
})
```

### 4. Threat Analysis
Automatically analyze weather data for potential threats.

```typescript
import { getWeatherThreatAssessment } from '@/lib/external-apis/weather'

const assessment = await getWeatherThreatAssessment('Bangkok, Thailand')

// Current weather
console.log(assessment.current)

// 7-day forecast
console.log(assessment.forecast)

// Active alerts
console.log(assessment.alerts)

// Detected threats
assessment.threats.forEach(threat => {
  console.log(threat.type) // flood, storm, heatwave
  console.log(threat.severity) // low, moderate, high, critical
  console.log(threat.description)
  console.log(threat.probability)
})
```

---

## Threat Detection Rules

### Flood Risk
- **Trigger:** Total precipitation > 50mm in a day
- **Critical:** > 100mm
- **High:** > 50mm
- **Factors:** Daily chance of rain, prolonged rainfall

### Storm Risk
- **Trigger:** Wind speed > 60 km/h
- **Critical:** > 100 km/h
- **High:** > 60 km/h
- **Factors:** Wind gusts, sustained winds

### Heatwave Risk
- **Trigger:** Temperature > 40°C
- **High:** > 45°C
- **Moderate:** > 40°C
- **Factors:** Feels-like temperature, humidity

### Extended Flood Risk
- **Trigger:** > 6 hours of heavy rain (>10mm/hour with >80% chance)
- **Severity:** High
- **Factors:** Duration, intensity, soil saturation

---

## Location Formats

WeatherAPI.com accepts multiple location formats:

### City Name
```typescript
getCurrentWeather('Jakarta')
getCurrentWeather('Jakarta, Indonesia')
```

### Coordinates
```typescript
getCurrentWeather('-6.2088,106.8456') // Latitude,Longitude
```

### US Zip Code
```typescript
getCurrentWeather('10001')
```

### UK Postcode
```typescript
getCurrentWeather('SW1')
```

### IP Address
```typescript
getCurrentWeather('auto:ip') // Auto-detect from IP
```

---

## Integration with Threat Analysis

The weather API is automatically integrated into the threat analysis system:

### Automatic Analysis
When a business completes onboarding or requests threat analysis:

1. **Location Detection:** Uses business city and country
2. **Weather Fetch:** Gets 7-day forecast and alerts
3. **Threat Detection:** Analyzes weather patterns
4. **AI Enhancement:** Cerebras AI considers weather data
5. **Database Storage:** Saves threats with weather context

### Example Flow
```typescript
// In app/api/threats/analyze/route.ts
const location = formatLocationString(profile.city, profile.country)
const weatherData = await getWeatherThreatAssessment(location)

// Weather threats are automatically detected
weatherData.threats.forEach(threat => {
  // Save to database
  await supabase.from('crisis_threats').insert({
    business_id: businessId,
    threat_type: threat.type,
    severity: threat.severity,
    probability: threat.probability,
    title: `Weather Alert: ${threat.type}`,
    description: threat.description,
    predicted_date: threat.date
  })
})
```

---

## API Response Examples

### Current Weather Response
```json
{
  "location": {
    "name": "Jakarta",
    "region": "Jakarta",
    "country": "Indonesia",
    "lat": -6.21,
    "lon": 106.85
  },
  "current": {
    "temp_c": 28.0,
    "temp_f": 82.4,
    "condition": {
      "text": "Partly cloudy",
      "code": 1003
    },
    "wind_kph": 15.1,
    "humidity": 75,
    "precip_mm": 0.0,
    "feelslike_c": 31.2
  }
}
```

### Forecast Response
```json
{
  "forecast": {
    "forecastday": [
      {
        "date": "2025-11-15",
        "day": {
          "maxtemp_c": 32.0,
          "mintemp_c": 24.0,
          "avgtemp_c": 28.0,
          "maxwind_kph": 20.5,
          "totalprecip_mm": 15.2,
          "avghumidity": 78,
          "daily_chance_of_rain": 60,
          "condition": {
            "text": "Moderate rain",
            "code": 1189
          }
        },
        "hour": [
          {
            "time": "2025-11-15 00:00",
            "temp_c": 25.0,
            "condition": {
              "text": "Clear",
              "code": 1000
            },
            "wind_kph": 12.0,
            "precip_mm": 0.0,
            "humidity": 80,
            "chance_of_rain": 10
          }
          // ... 23 more hours
        ]
      }
      // ... more days
    ]
  }
}
```

### Alert Response
```json
{
  "alerts": {
    "alert": [
      {
        "headline": "Flood Warning",
        "severity": "Moderate",
        "urgency": "Expected",
        "areas": "Jakarta Metropolitan Area",
        "category": "Met",
        "certainty": "Likely",
        "event": "Flood",
        "effective": "2025-11-15T00:00:00+07:00",
        "expires": "2025-11-16T00:00:00+07:00",
        "desc": "Heavy rainfall expected to cause flooding in low-lying areas.",
        "instruction": "Avoid travel through flooded areas. Move to higher ground if necessary."
      }
    ]
  }
}
```

---

## Error Handling

The weather API functions handle errors gracefully:

```typescript
const weather = await getCurrentWeather('InvalidLocation')
// Returns null if error occurs
// Logs error to console

if (!weather) {
  console.log('Weather data unavailable')
  // Fallback logic
}
```

---

## Rate Limits

### Free Tier
- **Calls per month:** 1,000,000
- **Calls per day:** ~33,000
- **Forecast days:** Up to 3 days
- **History days:** Up to 7 days

### Paid Tiers
- **Pro:** 5M calls/month, 14-day forecast
- **Business:** 10M calls/month, 14-day forecast
- **Enterprise:** Custom limits

---

## Best Practices

### 1. Cache Weather Data
```typescript
// Cache forecast for 1 hour
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour
let cachedForecast: { data: any, timestamp: number } | null = null

async function getCachedForecast(location: string) {
  if (cachedForecast && Date.now() - cachedForecast.timestamp < CACHE_DURATION) {
    return cachedForecast.data
  }
  
  const forecast = await getWeatherForecast(location)
  cachedForecast = { data: forecast, timestamp: Date.now() }
  return forecast
}
```

### 2. Batch Requests
```typescript
// Analyze multiple locations efficiently
const locations = ['Jakarta', 'Manila', 'Bangkok']
const assessments = await Promise.all(
  locations.map(loc => getWeatherThreatAssessment(loc))
)
```

### 3. Error Recovery
```typescript
async function getWeatherWithRetry(location: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const weather = await getCurrentWeather(location)
    if (weather) return weather
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
  }
  return null
}
```

---

## Testing

### Local Testing
```bash
# Set environment variable
export WEATHER_API_KEY=654cc07d55ae4170a9e80158251511

# Test in Node.js
node -e "
const { getCurrentWeather } = require('./lib/external-apis/weather');
getCurrentWeather('Jakarta').then(console.log);
"
```

### API Testing
```bash
# Direct API call
curl "https://api.weatherapi.com/v1/current.json?key=654cc07d55ae4170a9e80158251511&q=Jakarta"
```

---

## Troubleshooting

### Issue: API Key Not Working
**Solution:** 
- Verify key is set in environment variables
- Check key hasn't expired
- Ensure no extra spaces in key

### Issue: Location Not Found
**Solution:**
- Try different location formats
- Use coordinates instead of city name
- Check spelling of city name

### Issue: Rate Limit Exceeded
**Solution:**
- Implement caching
- Reduce forecast days
- Upgrade to paid tier

---

## Future Enhancements

### Planned Features
- [ ] Historical weather analysis
- [ ] Seasonal pattern detection
- [ ] Climate change trend analysis
- [ ] Multi-location monitoring
- [ ] Custom alert thresholds
- [ ] SMS/Email weather alerts
- [ ] Weather-based business insights

---

🌤️ **Weather-Powered Threat Detection for CrisisShield**
