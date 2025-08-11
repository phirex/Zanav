import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
  console.log('🔍 Listing all available tables...\n');
  
  try {
    // Try to get table information using a raw SQL query
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      console.log('RPC list_tables failed, trying alternative approach...');
      
      // Try to query information_schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.error('Error fetching schema info:', schemaError);
        return;
      }
      
      console.log('Tables in public schema:');
      schemaData.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('Tables:', data);
    }
    
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

listTables();
