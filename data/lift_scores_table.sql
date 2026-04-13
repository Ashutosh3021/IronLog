CREATE TABLE IF NOT EXISTS lift_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- ← fixed
  date DATE NOT NULL,
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 4),
  cycle INTEGER NOT NULL DEFAULT 1,
  lift_type TEXT NOT NULL CHECK (lift_type IN ('dl', 'bp', 'sq')),
  set_number INTEGER NOT NULL CHECK (set_number >= 1),
  weight_kg REAL,
  target_reps INTEGER NOT NULL,
  actual_reps TEXT,
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT lift_scores_user_date_lift_set_unique   -- ← added
    UNIQUE (user_id, date, lift_type, set_number)
);