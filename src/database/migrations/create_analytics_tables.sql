-- Create analytics sessions table
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  user_agent TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  language TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_url TEXT,
  page_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_organization_id ON analytics_sessions(organization_id);
CREATE INDEX idx_analytics_sessions_start_time ON analytics_sessions(start_time DESC);
CREATE INDEX idx_analytics_sessions_session_id ON analytics_sessions(session_id);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_organization_id ON analytics_events(organization_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_event_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

-- Row Level Security
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own analytics
CREATE POLICY "Users can view own analytics sessions" ON analytics_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics sessions" ON analytics_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics sessions" ON analytics_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create views for aggregated analytics
CREATE OR REPLACE VIEW analytics_daily_summary AS
SELECT 
  user_id,
  organization_id,
  DATE(start_time) as date,
  COUNT(DISTINCT session_id) as total_sessions,
  AVG(duration_seconds) as avg_session_duration,
  COUNT(DISTINCT platform) as unique_platforms
FROM analytics_sessions
WHERE duration_seconds IS NOT NULL
GROUP BY user_id, organization_id, DATE(start_time);

CREATE OR REPLACE VIEW analytics_event_summary AS
SELECT 
  user_id,
  organization_id,
  DATE(timestamp) as date,
  event_category,
  event_name,
  COUNT(*) as event_count
FROM analytics_events
GROUP BY user_id, organization_id, DATE(timestamp), event_category, event_name;

-- Grant permissions
GRANT SELECT ON analytics_daily_summary TO authenticated;
GRANT SELECT ON analytics_event_summary TO authenticated;