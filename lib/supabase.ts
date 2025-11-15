import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://drhsrmkaciinbyvefrmf.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaHNybWthY2lpbmJ5dmVmcm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMjgxODYsImV4cCI6MjA3NzkwNDE4Nn0.EVkiZNw2z21HkfLpyrUwSA0cmetNddK3CIPHNzH_6bU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaHNybWthY2lpbmJ5dmVmcm1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMyODE4NiwiZXhwIjoyMDc3OTA0MTg2fQ.RCxGfxcYwa1EwZZq-yFmU0-qE2Yo6eEFmSS67Jum9I0"

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

