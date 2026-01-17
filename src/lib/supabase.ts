import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  username: string;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  total_problems_solved: number;
  notification_enabled: boolean;
  notification_time: string;
  created_at: string;
};

export type Problem = {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  url: string | null;
  status: 'todo' | 'attempted' | 'solved';
  attempts: number;
  solved_at: string | null;
  time_spent_minutes: number;
  notes: string;
  created_at: string;
};

export type PracticeSession = {
  id: string;
  user_id: string;
  problem_id: string | null;
  session_date: string;
  duration_minutes: number;
  completed: boolean;
  notes: string;
  created_at: string;
};

export type TopicStats = {
  id: string;
  user_id: string;
  topic: string;
  total_attempted: number;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  last_practiced: string | null;
  updated_at: string;
};

export type PracticePlan = {
  id: string;
  user_id: string;
  topic: string;
  start_date: string;
  end_date: string;
  target_problems: number;
  completed_problems: number;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
};
