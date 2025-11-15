# 🛡️ CrisisShield

**Your AI-Powered Business Protection Platform**

Protect your business from disasters with AI-powered threat prediction, emergency planning, and recovery guidance.

---

## 🌟 Overview

CrisisShield is a comprehensive crisis management platform designed for small and medium businesses in developing regions. We help businesses predict threats, prepare emergency plans, and recover faster from any crisis.

### The Problem
- **90%** of small businesses in developing countries have NO disaster preparedness plan
- When crisis strikes, **60%** never reopen their doors
- Traditional emergency planning is expensive, complex, and designed for large corporations
- Small business owners are left vulnerable, unprepared, and alone

### Our Solution
CrisisShield provides enterprise-grade crisis management tools accessible to every business, regardless of size or budget.

---

## ✨ Key Features

### 🎯 AI Threat Prediction
- Real-time analysis of weather patterns, economic indicators, and regional risks
- Personalized threat assessments based on your business location and type
- Early warnings with probability scores and predicted timelines
- Comprehensive threat reports with AI recommendations

### 📋 Smart Emergency Planning
- AI-generated customized crisis response plans in minutes
- Tailored to your specific situation and business type
- Step-by-step actions for before, during, and after any crisis
- Optional situation descriptions for more personalized plans
- Action tracking with priority levels and completion status

### 📊 Recovery Tracking
- Visual progress monitoring through 6 recovery stages
- Milestone tracking to maintain momentum
- Operational capacity and revenue recovery metrics
- Integration with emergency plans for guided recovery

### 🆘 Crisis Management
- Report and track active crisis events
- AI-powered guidance during emergencies
- Real-time status updates and recommendations
- Crisis timeline and impact tracking

### 💰 Funding Opportunities
- Automatic matching with grants, loans, and relief programs
- Deadline tracking so you never miss an opportunity
- Eligibility filtering based on crisis type and location
- Direct application links and requirements

### 📈 Business Analytics
- Comprehensive threat and crisis analytics
- Business preparedness scoring
- Trend analysis over time
- Data-driven insights for better decision-making

### 💬 AI Crisis Assistant
- Real-time chat support during active crises
- Context-aware recommendations
- Historical conversation tracking
- Personalized guidance based on your business profile

---

## 🚀 Technology Stack

- **Frontend:** Next.js 15, React 18, TypeScript
- **UI Framework:** React Bootstrap, Bootstrap 5
- **AI/ML:** Cerebras Cloud SDK for lightning-fast AI processing
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Clerk
- **Deployment:** Vercel (recommended)
- **APIs:** Weather data, economic indicators, threat intelligence

---

## 📦 Installation

### Prerequisites
- Node.js 20.9.0 or higher (required for Next.js 16)
- npm 10.0.0 or higher
- Supabase account
- Clerk account
- Cerebras API key
- WeatherAPI.com API key

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/crisisshield.git
cd crisisshield
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cerebras AI
CEREBRAS_API_KEY=your_cerebras_api_key

# Weather API (WeatherAPI.com)
WEATHER_API_KEY=your_weather_api_key
```

4. **Set up the database**
Run the SQL schema in your Supabase project:
```bash
# Copy the contents of lib/database/schema.sql
# Run in Supabase SQL Editor
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

### Core Tables
- `business_profiles` - Business information and settings
- `crisis_threats` - Predicted threats and risk assessments
- `crisis_events` - Active and historical crisis events
- `emergency_plans` - Crisis response plans
- `recovery_progress` - Recovery tracking data
- `funding_opportunities` - Available grants and loans
- `threat_reports` - Generated threat analysis reports
- `crisis_guidance_messages` - AI chat history

---

## 🎯 Usage

### For Business Owners

1. **Sign Up & Onboarding**
   - Create your account
   - Complete your business profile
   - Get instant threat analysis

2. **Monitor Threats**
   - View active threats on your dashboard
   - Generate detailed threat reports
   - Set up alert preferences

3. **Create Emergency Plans**
   - Choose crisis type
   - Describe your situation (optional)
   - Get AI-generated plan in seconds
   - Track action completion

4. **Manage Crises**
   - Report active crises
   - Get real-time AI guidance
   - Track recovery progress
   - Find funding opportunities

5. **Track Recovery**
   - Monitor operational capacity
   - Track revenue recovery
   - Set and achieve milestones
   - Complete recovery actions

---

## 🌍 Target Markets

### Primary Focus
- **Southeast Asia:** Indonesia, Philippines, Vietnam, Thailand
- **South Asia:** India, Bangladesh
- **Target:** 50+ million small businesses

### Business Types
- Retail stores
- Restaurants and food services
- Manufacturing
- Hospitality
- Agriculture
- Services
- Construction

### Crisis Types Covered
- Natural disasters (floods, earthquakes, typhoons)
- Pandemics and health crises
- Economic downturns
- Supply chain disruptions
- Cyber attacks
- Fire emergencies
- Power outages

---

## 💼 Business Model

### Pricing Tiers

**Free Tier**
- Basic threat alerts
- 1 emergency plan
- Community support
- Limited analytics

**Pro - $19/month**
- Unlimited threat reports
- Unlimited emergency plans
- Advanced AI analysis
- Priority support
- Full analytics dashboard
- Recovery tracking

**Enterprise - $99/month**
- Multi-location support
- Team collaboration
- API access
- Custom integrations
- Dedicated account manager
- White-label options

### Revenue Streams
1. Subscription fees (SaaS)
2. Commission on funded relief applications (5%)
3. Enterprise partnerships
4. API licensing
5. Premium features and add-ons

---

## 📊 Impact Metrics

### Goals
- **2025:** 10,000 businesses protected
- **2026:** 100,000 businesses protected
- **2027:** 1,000,000 businesses protected

### Success Metrics
- Businesses saved from closure
- Jobs protected
- Economic value preserved
- Crisis response time reduction
- Recovery time improvement

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Cerebras** for lightning-fast AI processing
- **Supabase** for real-time database infrastructure
- **Clerk** for secure authentication
- **Bootstrap** for responsive UI components
- All the small business owners who inspired this project

---

## 📞 Contact & Support

- **Website:** [crisisshield.com](https://crisisshield.com) (coming soon)
- **Email:** support@crisisshield.com
- **Twitter:** [@CrisisShield](https://twitter.com/crisisshield)
- **Discord:** [Join our community](https://discord.gg/crisisshield)

---

## 🚀 Roadmap

### Phase 1 (Current)
- ✅ Core threat prediction
- ✅ AI emergency planning
- ✅ Recovery tracking
- ✅ Funding opportunities
- ✅ Crisis management
- ✅ Business analytics

### Phase 2 (Q1 2026)
- 🔄 Mobile apps (iOS/Android)
- 🔄 SMS alert system
- 🔄 Offline mode
- 🔄 Multi-language support
- 🔄 Integration with government alert systems

### Phase 3 (Q2 2026)
- 📋 Team collaboration features
- 📋 Multi-location support
- 📋 Advanced analytics and reporting
- 📋 API for third-party integrations
- 📋 Insurance partner integrations

### Phase 4 (Q3 2026)
- 📋 Community features
- 📋 Peer-to-peer support network
- 📋 Crisis response marketplace
- 📋 Educational resources and training
- 📋 Certification programs

---

## 🌟 Why CrisisShield?

**Because every business deserves a fighting chance.**

We believe that crisis preparedness shouldn't be a luxury reserved for large corporations. Every small business owner deserves access to the tools and knowledge needed to protect their livelihood, their employees, and their community.

CrisisShield levels the playing field, making enterprise-grade crisis management accessible to everyone.

---

**Built with ❤️ for small businesses everywhere**

🛡️ **CrisisShield - Your AI-Powered Business Protection**
