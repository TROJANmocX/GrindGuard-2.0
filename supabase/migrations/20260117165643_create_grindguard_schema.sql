/*
  # GrindGuard™ Database Schema

  ## Overview
  Creates the complete database schema for GrindGuard™, a ruthless accountability app for coding practice.

  ## New Tables
  
  ### `user_profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `username` (text, unique) - Display name
  - `current_streak` (integer) - Current practice streak in days
  - `longest_streak` (integer) - All-time longest streak
  - `last_practice_date` (date) - Last day user practiced
  - `total_problems_solved` (integer) - Lifetime problem count
  - `notification_enabled` (boolean) - Enable daily reminders
  - `notification_time` (time) - Preferred notification time
  - `created_at` (timestamptz) - Account creation timestamp

  ### `problems`
  - `id` (uuid, primary key) - Unique problem identifier
  - `user_id` (uuid, foreign key) - Owner of this problem entry
  - `title` (text) - Problem name
  - `platform` (text) - LeetCode, Codeforces, etc.
  - `difficulty` (text) - Easy, Medium, Hard
  - `topic` (text) - DP, Graphs, Arrays, etc.
  - `url` (text) - Link to problem
  - `status` (text) - todo, attempted, solved
  - `attempts` (integer) - Number of attempts
  - `solved_at` (timestamptz) - When problem was solved
  - `time_spent_minutes` (integer) - Total time spent
  - `notes` (text) - User notes
  - `created_at` (timestamptz) - When added

  ### `practice_sessions`
  - `id` (uuid, primary key) - Session identifier
  - `user_id` (uuid, foreign key) - User who practiced
  - `problem_id` (uuid, foreign key) - Problem practiced
  - `session_date` (date) - Date of practice
  - `duration_minutes` (integer) - Session length
  - `completed` (boolean) - Whether problem was solved this session
  - `notes` (text) - Session notes
  - `created_at` (timestamptz) - Session start time

  ### `topic_stats`
  - `id` (uuid, primary key) - Stat identifier
  - `user_id` (uuid, foreign key) - User these stats belong to
  - `topic` (text) - Topic name (DP, Graphs, etc.)
  - `total_attempted` (integer) - Problems attempted in this topic
  - `total_solved` (integer) - Problems solved in this topic
  - `easy_solved` (integer) - Easy problems solved
  - `medium_solved` (integer) - Medium problems solved
  - `hard_solved` (integer) - Hard problems solved
  - `last_practiced` (date) - Most recent practice in this topic
  - `updated_at` (timestamptz) - Last update timestamp

  ### `practice_plans`
  - `id` (uuid, primary key) - Plan identifier
  - `user_id` (uuid, foreign key) - User this plan is for
  - `topic` (text) - Focus topic
  - `start_date` (date) - Plan start date
  - `end_date` (date) - Plan end date
  - `target_problems` (integer) - Number of problems to solve
  - `completed_problems` (integer) - Problems completed so far
  - `status` (text) - active, completed, abandoned
  - `created_at` (timestamptz) - Plan creation time

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_practice_date date,
  total_problems_solved integer DEFAULT 0,
  notification_enabled boolean DEFAULT true,
  notification_time time DEFAULT '20:00:00',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  platform text DEFAULT 'LeetCode',
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  topic text NOT NULL,
  url text,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'attempted', 'solved')),
  attempts integer DEFAULT 0,
  solved_at timestamptz,
  time_spent_minutes integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own problems"
  ON problems FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problems"
  ON problems FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems"
  ON problems FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems"
  ON problems FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE,
  session_date date DEFAULT CURRENT_DATE,
  duration_minutes integer DEFAULT 0,
  completed boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON practice_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON practice_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON practice_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON practice_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create topic_stats table
CREATE TABLE IF NOT EXISTS topic_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  total_attempted integer DEFAULT 0,
  total_solved integer DEFAULT 0,
  easy_solved integer DEFAULT 0,
  medium_solved integer DEFAULT 0,
  hard_solved integer DEFAULT 0,
  last_practiced date,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic)
);

ALTER TABLE topic_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topic stats"
  ON topic_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic stats"
  ON topic_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic stats"
  ON topic_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own topic stats"
  ON topic_stats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create practice_plans table
CREATE TABLE IF NOT EXISTS practice_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  start_date date DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  target_problems integer NOT NULL,
  completed_problems integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own practice plans"
  ON practice_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice plans"
  ON practice_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice plans"
  ON practice_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice plans"
  ON practice_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_problems_user_id ON problems(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_topic ON problems(topic);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_date ON practice_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_topic_stats_user_id ON topic_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_user_id ON practice_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_status ON practice_plans(status);