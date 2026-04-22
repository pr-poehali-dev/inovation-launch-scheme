
CREATE TABLE t_p61927516_inovation_launch_sch.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p61927516_inovation_launch_sch.schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES t_p61927516_inovation_launch_sch.users(id),
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('study', 'work', 'deadline', 'sport', 'rest', 'social')),
  day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME,
  end_time TIME,
  date DATE,
  description TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'file', 'url', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p61927516_inovation_launch_sch.ai_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES t_p61927516_inovation_launch_sch.users(id),
  week_start DATE NOT NULL,
  plan_json JSONB NOT NULL,
  source_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON t_p61927516_inovation_launch_sch.schedule_events(user_id);
CREATE INDEX ON t_p61927516_inovation_launch_sch.ai_plans(user_id);
