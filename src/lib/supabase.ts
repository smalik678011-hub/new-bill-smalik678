import { createClient } from '@supabase/supabase-js';

const VITE_SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

let supabaseUrl = VITE_SUPABASE_URL;

// If URL is set but doesn't start with http, prepend https
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// Fallback to placeholder if environment variables are not set
const finalSupabaseUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const finalSupabaseAnonKey = VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey);
