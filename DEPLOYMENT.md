# 🚀 CrisisShield Deployment Guide

## Netlify Deployment

### Prerequisites
- GitHub repository with your code
- Netlify account
- Required API keys (Clerk, Supabase, Cerebras)

### Environment Variables Required

Add these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk URLs (Required)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cerebras AI (Required)
CEREBRAS_API_KEY=csk-...

# Weather API (Required)
WEATHER_API_KEY=your_weather_api_key
```

### Build Settings

**Build command:** `npm run build`
**Publish directory:** `.next`
**Node version:** 20.24.0 or higher (required for Next.js 16)

### Deployment Steps

1. **Connect Repository**
   - Go to Netlify Dashboard
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Install the Next.js plugin (should auto-detect)

3. **Add Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all required variables listed above
   - Make sure to mark sensitive keys as "Secret"

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (usually 2-3 minutes)

### Troubleshooting

#### Build Fails with TypeScript Errors

**Issue:** Type errors in API routes about params
**Solution:** Ensure all API route handlers use plain object types for params, not Promises

```typescript
// ✅ Correct
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) { ... }

// ❌ Wrong
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) { ... }
```

#### Missing Environment Variables

**Issue:** Build succeeds but app doesn't work
**Solution:** 
1. Check all environment variables are set in Netlify
2. Ensure `NEXT_PUBLIC_` prefix for client-side variables
3. Redeploy after adding variables

#### Database Connection Issues

**Issue:** Can't connect to Supabase
**Solution:**
1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Ensure RLS policies are set up correctly

#### Clerk Authentication Not Working

**Issue:** Sign in/up redirects fail
**Solution:**
1. Add your Netlify domain to Clerk allowed domains
2. Update Clerk environment variables
3. Check webhook secret is correct

### Post-Deployment Checklist

- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test onboarding process
- [ ] Verify threat analysis works
- [ ] Test emergency plan generation
- [ ] Check recovery tracking
- [ ] Verify funding opportunities load
- [ ] Test all navigation links
- [ ] Check mobile responsiveness
- [ ] Verify all environment variables are working

### Performance Optimization

1. **Enable Caching**
   - Netlify automatically caches static assets
   - Next.js handles page caching

2. **Image Optimization**
   - Next.js Image component is already optimized
   - Netlify serves images via CDN

3. **Database Queries**
   - Supabase has built-in connection pooling
   - Consider adding indexes for frequently queried fields

### Monitoring

1. **Netlify Analytics**
   - Enable in Site Settings → Analytics
   - Monitor page views, load times, errors

2. **Error Tracking**
   - Check Netlify Functions logs for API errors
   - Monitor Supabase logs for database issues

3. **Performance**
   - Use Lighthouse for performance audits
   - Monitor Core Web Vitals in Netlify

### Custom Domain (Optional)

1. **Add Domain**
   - Go to Site Settings → Domain management
   - Click "Add custom domain"
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Netlify automatically provisions SSL
   - Usually takes 1-2 minutes

3. **Recommended Domain**
   - crisisshield.com
   - crisisshield.app
   - crisisshield.io

### Continuous Deployment

Netlify automatically deploys when you push to your main branch:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Automatic Build**
   - Netlify detects the push
   - Starts build automatically
   - Deploys if build succeeds

3. **Deploy Previews**
   - Pull requests get preview deployments
   - Test changes before merging

### Rollback

If a deployment has issues:

1. Go to Deploys tab in Netlify
2. Find the last working deployment
3. Click "Publish deploy"
4. Site reverts to that version

### Support

- **Netlify Docs:** https://docs.netlify.com
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Clerk Docs:** https://clerk.com/docs

---

## Alternative: Vercel Deployment

### Quick Deploy

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   vercel env add CLERK_SECRET_KEY
   # ... add all other variables
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Vercel Dashboard

1. Import project from GitHub
2. Add environment variables
3. Deploy

---

## Database Setup

### Supabase Tables

Run the SQL schema from `lib/database/schema.sql` in Supabase SQL Editor:

1. Go to Supabase Dashboard
2. Click SQL Editor
3. Paste schema contents
4. Run query

### Required Tables

- `business_profiles`
- `crisis_threats`
- `crisis_events`
- `emergency_plans`
- `recovery_progress`
- `funding_opportunities`
- `threat_reports`
- `crisis_guidance_messages`

---

## Security Checklist

- [ ] All API keys are in environment variables (not in code)
- [ ] Supabase RLS policies are enabled
- [ ] Clerk authentication is properly configured
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled (if needed)
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Supabase client)
- [ ] XSS prevention (React handles this)

---

## Production Readiness

### Before Going Live

1. **Test Everything**
   - All user flows
   - Error handling
   - Edge cases

2. **Performance**
   - Run Lighthouse audit
   - Optimize images
   - Minimize bundle size

3. **Security**
   - Review all API endpoints
   - Check authentication flows
   - Verify data access controls

4. **Monitoring**
   - Set up error tracking
   - Configure analytics
   - Monitor API usage

5. **Documentation**
   - User guide
   - API documentation
   - Troubleshooting guide

---

## Scaling Considerations

### When to Scale

- More than 10,000 active users
- Database queries slowing down
- API rate limits being hit
- High traffic periods

### How to Scale

1. **Database**
   - Upgrade Supabase plan
   - Add read replicas
   - Implement caching

2. **API**
   - Add rate limiting
   - Implement queue system
   - Use CDN for static assets

3. **AI Processing**
   - Batch requests
   - Implement caching
   - Consider dedicated AI infrastructure

---

🛡️ **CrisisShield - Ready to Deploy!**
