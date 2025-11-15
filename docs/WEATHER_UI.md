# 🌤️ Weather UI/UX Documentation

## Overview

CrisisShield now includes comprehensive weather UI components that display real-time weather data, forecasts, and alerts directly in the application.

---

## Components

### 1. WeatherWidget
**Location:** `components/WeatherWidget.tsx`

Displays current weather conditions and 3-day forecast.

**Features:**
- Current temperature (Celsius and Fahrenheit)
- "Feels like" temperature
- Weather condition with emoji icons
- Wind speed with severity indicator
- Humidity percentage
- Precipitation amount
- 3-day forecast with high/low temps
- Rain probability indicators
- Heavy rain warnings

**Usage:**
```tsx
<WeatherWidget 
  location="Jakarta, Indonesia"
  showForecast={true}
/>
```

**Props:**
- `location` (string): City and country
- `showForecast` (boolean): Show 3-day forecast

---

### 2. WeatherAlerts
**Location:** `components/WeatherAlerts.tsx`

Displays active weather alerts and warnings.

**Features:**
- Real-time weather alerts
- Severity indicators (Extreme, Moderate, Minor)
- Urgency badges (Immediate, Expected, Future)
- Alert descriptions and instructions
- Expiration times
- Detailed modal view
- Safety instructions

**Usage:**
```tsx
<WeatherAlerts location="Manila, Philippines" />
```

**Props:**
- `location` (string): City and country

**Alert States:**
- ✅ No alerts: Green success message
- ⚠️ Active alerts: Color-coded by severity
- 🚨 Extreme alerts: Red danger styling

---

## Pages

### Dashboard Integration
**Location:** `app/dashboard/page.tsx`

Weather components are integrated into the dashboard sidebar:

1. **Weather Alerts** (top)
   - Shows active alerts immediately
   - Prominent placement for visibility
   - Color-coded for urgency

2. **Weather Widget** (below alerts)
   - Current conditions
   - 3-day forecast
   - Quick weather overview

**Layout:**
```
┌─────────────────────────────────────┐
│ Weather Alerts (if any)             │
├─────────────────────────────────────┤
│ Weather Widget                      │
│ - Current: 28°C                     │
│ - Forecast: 3 days                  │
├─────────────────────────────────────┤
│ Quick Actions                       │
└─────────────────────────────────────┘
```

---

### Weather Page
**Location:** `app/weather/page.tsx`

Dedicated weather page with comprehensive information.

**Sections:**

1. **Weather Alerts** (full width)
   - All active alerts
   - Detailed information
   - Safety instructions

2. **Current Weather** (sidebar)
   - Real-time conditions
   - 3-day forecast

3. **Active Weather Threats**
   - Weather-related threats from database
   - Probability indicators
   - Severity badges
   - Links to threat details

4. **Risk Information Cards**
   - Flood Risk
   - Storm Risk
   - Heat Risk
   - Quick links to create emergency plans

5. **Preparedness Tips**
   - Before severe weather
   - During severe weather
   - Best practices

**Access:** Navigation menu → "Weather"

---

## API Routes

### GET /api/weather
**Location:** `app/api/weather/route.ts`

Fetches current weather or forecast data.

**Query Parameters:**
- `location` (required): City and country
- `forecast` (optional): "true" to include 3-day forecast

**Response:**
```json
{
  "location": {
    "name": "Jakarta",
    "region": "Jakarta",
    "country": "Indonesia"
  },
  "current": {
    "temp_c": 28.0,
    "condition": {
      "text": "Partly cloudy",
      "code": 1003
    },
    "wind_kph": 15.1,
    "humidity": 75
  },
  "forecast": {
    "forecastday": [...]
  }
}
```

---

### GET /api/weather/alerts
**Location:** `app/api/weather/alerts/route.ts`

Fetches active weather alerts.

**Query Parameters:**
- `location` (required): City and country

**Response:**
```json
{
  "alerts": [
    {
      "headline": "Flood Warning",
      "severity": "Moderate",
      "urgency": "Expected",
      "event": "Flood",
      "desc": "Heavy rainfall expected...",
      "instruction": "Avoid travel through flooded areas..."
    }
  ],
  "count": 1
}
```

---

## Visual Design

### Color Scheme

**Weather Conditions:**
- ☀️ Sunny: Yellow/Gold
- ☁️ Cloudy: Gray
- 🌧️ Rain: Blue
- ⛈️ Storm: Dark Blue/Purple
- ❄️ Snow: Light Blue
- 🌫️ Fog: Light Gray

**Alert Severity:**
- 🚨 Extreme/Severe: Red (`danger`)
- ⚠️ Moderate: Orange (`warning`)
- ℹ️ Minor: Blue (`info`)
- ✅ No alerts: Green (`success`)

**Urgency Badges:**
- IMMEDIATE: Red
- EXPECTED: Orange
- FUTURE: Blue

**Wind Strength:**
- Light: < 10 km/h
- Moderate: 10-30 km/h
- Strong: 30-60 km/h
- Very Strong: > 60 km/h

---

## Weather Icons

Emoji-based icons for universal understanding:

| Condition | Icon | Code Range |
|-----------|------|------------|
| Sunny | ☀️ | 1000 |
| Cloudy | ☁️ | 1003, 1006, 1009 |
| Rain | 🌧️ | 1063, 1180-1195 |
| Snow | ❄️ | 1066, 1210-1225 |
| Thunderstorm | ⛈️ | 1087, 1273, 1276 |
| Fog | 🌫️ | 1030, 1135, 1147 |
| Default | 🌤️ | Other |

---

## User Experience Flow

### First-Time User
1. Complete onboarding with city/country
2. Dashboard loads with weather data
3. See current conditions immediately
4. View any active alerts
5. Explore weather page for details

### Daily User
1. Check dashboard for weather alerts
2. Review 3-day forecast
3. Monitor threat probability
4. Take action on warnings

### During Alert
1. Alert appears prominently on dashboard
2. Red/orange color coding for urgency
3. Click for detailed instructions
4. Follow safety recommendations
5. Create/activate emergency plan

---

## Responsive Design

### Desktop (> 768px)
- Weather alerts: Full width
- Weather widget: Sidebar (4 columns)
- Forecast: 3 cards side-by-side

### Tablet (768px - 992px)
- Weather alerts: Full width
- Weather widget: Half width
- Forecast: 3 cards side-by-side

### Mobile (< 768px)
- Weather alerts: Full width, stacked
- Weather widget: Full width
- Forecast: 3 cards stacked vertically

---

## Loading States

### Weather Widget
```
┌─────────────────────┐
│  🔄 Loading...      │
│  Loading weather... │
└─────────────────────┘
```

### Weather Alerts
```
┌─────────────────────┐
│  🔄 Checking...     │
└─────────────────────┘
```

### Error State
```
┌─────────────────────┐
│  ⚠️ Weather data    │
│  unavailable        │
└─────────────────────┘
```

---

## Accessibility

### Screen Readers
- Semantic HTML structure
- ARIA labels for icons
- Descriptive text for conditions
- Alert severity announced

### Keyboard Navigation
- Tab through alerts
- Enter to open details
- Escape to close modals

### Color Contrast
- WCAG AA compliant
- Text readable on all backgrounds
- Icons supplement color coding

---

## Performance

### Caching Strategy
- Weather data cached for 1 hour
- Alerts checked every 30 minutes
- Forecast updated every 6 hours

### API Optimization
- Single request for current + forecast
- Batch requests for multiple locations
- Error handling with graceful fallbacks

### Loading Optimization
- Lazy load weather components
- Show cached data immediately
- Update in background

---

## Future Enhancements

### Planned Features
- [ ] Hourly forecast (24 hours)
- [ ] Weather radar integration
- [ ] Historical weather data
- [ ] Weather-based notifications
- [ ] Custom alert thresholds
- [ ] Multi-location monitoring
- [ ] Weather impact predictions
- [ ] Seasonal patterns
- [ ] Climate change trends

### UI Improvements
- [ ] Interactive weather maps
- [ ] Animated weather icons
- [ ] Chart visualizations
- [ ] Weather comparison tools
- [ ] Export weather reports

---

## Testing

### Manual Testing Checklist
- [ ] Weather widget loads correctly
- [ ] Forecast displays 3 days
- [ ] Alerts show when active
- [ ] No alerts message displays
- [ ] Modal opens with details
- [ ] Icons match conditions
- [ ] Colors indicate severity
- [ ] Mobile responsive
- [ ] Loading states work
- [ ] Error handling works

### Test Locations
- Jakarta, Indonesia (tropical)
- Manila, Philippines (typhoon-prone)
- Mumbai, India (monsoon)
- Bangkok, Thailand (flooding)
- Singapore (stable weather)

---

## Troubleshooting

### Weather Not Loading
1. Check WEATHER_API_KEY is set
2. Verify location format
3. Check API rate limits
4. Review browser console

### Alerts Not Showing
1. Verify location has alerts
2. Check API response
3. Ensure alerts endpoint working
4. Test with known alert location

### Incorrect Data
1. Verify location spelling
2. Check API response format
3. Ensure timezone handling
4. Validate data parsing

---

🌤️ **Weather-Powered Business Protection**
