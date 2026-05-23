import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env parameters!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWithAuth() {
  const email = `test.user.billkaro.${Date.now()}@gmail.com`;
  const password = `StrongPassword123!`;

  try {
    console.log('Signing up dummy user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Sign up error:', authError.message);
      return;
    }

    const user = authData.user;
    if (!user) {
      console.error('No user returned from signup');
      return;
    }

    console.log('Dummy user registered successfully. ID:', user.id);

    const testTables = [
      'businesses',
      'business',
      'user_business',
      'user_businesses',
      'profiles',
      'profile',
      'contractors'
    ];

    for (const name of testTables) {
      const { data, error } = await supabase.from(name).select('*').limit(1);
      if (error) {
        console.log(`Table "${name}":`, error.message);
      } else {
        console.log(`Table "${name}": SUCCESS!`, data);
      }
    }
  } catch (err: any) {
    console.error('Test error:', err.message);
  }
}

testWithAuth();
