import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);
console.log('Key available:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to fetch something simple, like a non-existent table or health check
    // Actually, just checking if we can talk to the auth endpoint or query a public table
    console.log('Attempting to fetch session...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth Error:', error.message);
    } else {
      console.log('Connection successful! Session data retrieved (even if null).');
    }

    // Try a DB query
    console.log('Attempting to select from profiles (might fail if empty or RLS, but should connect)...');
    const { data: dbData, error: dbError } = await supabase.from('profiles').select('count').limit(1);
    
    if (dbError) {
      console.error('DB Error:', dbError.message, dbError.code);
    } else {
      console.log('DB Connection successful!');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
