import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co') {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = !!supabaseInstance;
