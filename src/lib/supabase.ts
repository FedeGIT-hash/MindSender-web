import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Missing Supabase environment variables in .env file');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase Connection Status:');
console.log('✅ Client Initialized');
console.log(`🔗 URL: ${supabaseUrl}`);
console.log(`🔑 Key Loaded: ${!!supabaseAnonKey}`);

