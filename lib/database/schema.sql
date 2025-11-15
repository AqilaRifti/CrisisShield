-- Threat Reports Table
CREATE TABLE IF NOT EXISTS threat_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  report_type VARCHAR(50) NOT NULL DEFAULT 'comprehensive',
  timeframe_days INTEGER NOT NULL DEFAULT 30,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threat_reports_business_id ON threat_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_threat_reports_generated_at ON threat_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_threat_reports_report_type ON threat_reports(report_type);

-- Add situation description to emergency plans
ALTER TABLE emergency_plans ADD COLUMN IF NOT EXISTS situation_description TEXT;

-- Update existing tables with missing columns if needed
ALTER TABLE crisis_threats ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE crisis_events ADD COLUMN IF NOT EXISTS ai_guidance TEXT[];
ALTER TABLE recovery_progress ADD COLUMN IF NOT EXISTS milestones_completed JSONB DEFAULT '[]';
ALTER TABLE recovery_progress ADD COLUMN IF NOT EXISTS next_actions TEXT[] DEFAULT '{}';

-- Add RLS policies
ALTER TABLE threat_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own threat reports" ON threat_reports
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM business_profiles WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can create their own threat reports" ON threat_reports
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM business_profiles WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_threat_reports_updated_at 
  BEFORE UPDATE ON threat_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();