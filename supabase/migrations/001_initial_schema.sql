-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'learner'
                CHECK (role IN ('learner','mentor','admin','alumni')),
  full_name     TEXT NOT NULL DEFAULT '',
  bio           TEXT,
  avatar_url    TEXT,
  portfolio_url TEXT,
  track         TEXT CHECK (track IN ('design_lab','oss_lab')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- COHORTS
CREATE TABLE cohorts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  track         TEXT NOT NULL CHECK (track IN ('design_lab','oss_lab')),
  starts_at     DATE NOT NULL,
  ends_at       DATE,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','completed','archived')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ENROLLMENTS
CREATE TABLE enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cohort_id     UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  role_in_cohort TEXT NOT NULL DEFAULT 'learner'
                CHECK (role_in_cohort IN ('learner','mentor')),
  enrolled_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cohort_id)
);

-- INVITES
CREATE TABLE invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  track         TEXT NOT NULL CHECK (track IN ('design_lab','oss_lab')),
  max_uses      INT DEFAULT 10,
  use_count     INT DEFAULT 0,
  active        BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES profiles(id),
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- TRACKS
CREATE TABLE tracks (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT
);

INSERT INTO tracks VALUES
  ('design_lab', 'Design Lab', 'Bitcoin product and UX design'),
  ('oss_lab', 'Open Source Lab', 'Bitcoin open source contributions');

-- UNITS
CREATE TABLE units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id      TEXT NOT NULL REFERENCES tracks(id),
  title         TEXT NOT NULL,
  description   TEXT,
  sort_order    INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- MODULES
CREATE TABLE modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id       UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  slug          TEXT NOT NULL UNIQUE,
  sort_order    INT NOT NULL,
  is_mission    BOOLEAN DEFAULT false,
  review_type   TEXT CHECK (review_type IN ('completion_only','reviewed')),
  rubric        JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- LESSONS
CREATE TABLE lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  content_path  TEXT NOT NULL,
  video_url     TEXT,
  transcript    TEXT,
  summary       TEXT,
  sort_order    INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_id, slug)
);

-- MISSION DEADLINES
CREATE TABLE mission_deadlines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES modules(id),
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  due_at        TIMESTAMPTZ NOT NULL,
  UNIQUE(module_id, cohort_id)
);

-- MODULE COMPLETIONS
CREATE TABLE module_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  module_id     UUID NOT NULL REFERENCES modules(id),
  completed_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- SUBMISSIONS
CREATE TABLE submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  module_id     UUID NOT NULL REFERENCES modules(id),
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  link_url      TEXT NOT NULL,
  file_url      TEXT,
  file_name     TEXT,
  status        TEXT NOT NULL DEFAULT 'submitted'
                CHECK (status IN
                  ('submitted','in_review','passed','needs_revision')),
  is_late       BOOLEAN DEFAULT false,
  version       INT NOT NULL DEFAULT 1,
  parent_id     UUID REFERENCES submissions(id),
  submitted_at  TIMESTAMPTZ DEFAULT now()
);

-- REVIEWS
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES profiles(id),
  outcome       TEXT NOT NULL CHECK (outcome IN ('passed','needs_revision')),
  comment       TEXT NOT NULL,
  rubric_scores JSONB,
  reviewed_at   TIMESTAMPTZ DEFAULT now()
);

-- WORKSHOPS
CREATE TABLE workshops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  cohort_id     UUID NOT NULL REFERENCES cohorts(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  timezone      TEXT NOT NULL DEFAULT 'Africa/Lagos',
  meeting_url   TEXT NOT NULL,
  recording_url TEXT,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- RESOURCES
CREATE TABLE resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('link','file')),
  url           TEXT NOT NULL,
  file_name     TEXT,
  tags          TEXT[] DEFAULT '{}',
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  scope         TEXT NOT NULL DEFAULT 'global'
                CHECK (scope IN ('global','cohort')),
  cohort_id     UUID REFERENCES cohorts(id),
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT,
  read          BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ROW LEVEL SECURITY

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ENROLLMENTS policies
CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all enrollments"
  ON enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- MODULE COMPLETIONS policies
CREATE POLICY "Users can view own completions"
  ON module_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON module_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SUBMISSIONS policies
CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentors and admins can view all submissions"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('mentor','admin')
    )
  );

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- PUBLIC READ policies (content available to all authenticated users)
CREATE POLICY "Authenticated users can read units"
  ON units FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read modules"
  ON modules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read lessons"
  ON lessons FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read resources"
  ON resources FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read announcements"
  ON announcements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read workshops"
  ON workshops FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read cohorts"
  ON cohorts FOR SELECT
  USING (auth.role() = 'authenticated');

-- INVITES policies
CREATE POLICY "Admins can manage invites"
  ON invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'learner'
  );
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
