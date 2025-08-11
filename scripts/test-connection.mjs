import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('\n🔍 Testing Supabase connection...\n');
  
  try {
    // Try a simple query to test connection
    console.log('Testing connection with a simple query...');
    
    // Try to get the current user (this should work even if tables don't exist)
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('Auth test failed, trying to list tables...');
      
      // Try to list tables using a different approach
      const { data: tables, error: tablesError } = await supabase
        .from('Tenant')
        .select('count')
        .limit(1);
      
      if (tablesError) {
        console.error('Error accessing Tenant table:', tablesError);
        
        // Try to see if we can get any response from the database
        console.log('Trying to get database info...');
        
        // This is a bit of a hack, but let's try to see what we can access
        const { data: testData, error: testError } = await supabase
          .from('_supabase_migrations')
          .select('*')
          .limit(1);
        
        if (testError) {
          console.error('Error accessing migrations table:', testError);
        } else {
          console.log('Migrations table accessible:', testData);
        }
      } else {
        console.log('Tenant table accessible:', tables);
      }
    } else {
      console.log('Auth test successful:', data);
    }
    
  } catch (error) {
    console.error('Error during connection test:', error);
  }
}

testConnection();
