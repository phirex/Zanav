#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const USER_EMAIL = 'ori@walla.com';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findAllOriUsers() {
  try {
    console.log(`🔍 Searching for ALL users with email: ${USER_EMAIL}`);

    // Check all auth users
    console.log('\n📋 Checking Supabase Auth users...');
    try {
      const { data: allAuthUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error('Error listing auth users:', authError);
      } else {
        const oriAuthUsers = allAuthUsers.users.filter(user => user.email === USER_EMAIL);
        if (oriAuthUsers.length > 0) {
          console.log('❌ Found auth users with ori@walla.com:');
          oriAuthUsers.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Created: ${user.created_at}`);
          });
        } else {
          console.log('✅ No auth users found with ori@walla.com');
        }
      }
    } catch (e) {
      console.error('Error checking auth users:', e);
    }

    // Check User table
    console.log('\n👤 Checking User table...');
    const { data: userRecords, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', USER_EMAIL);
    
    if (userError) {
      console.error('Error checking User table:', userError);
    } else if (userRecords && userRecords.length > 0) {
      console.log('❌ Found User table records:');
      userRecords.forEach(user => {
        console.log(`  - Internal ID: ${user.id}, Supabase ID: ${user.supabaseUserId}, Email: ${user.email}, Name: ${user.name}`);
      });
    } else {
      console.log('✅ No User table records found');
    }

    // Check UserTenant relationships
    console.log('\n🔗 Checking UserTenant relationships...');
    const { data: userTenantRecords, error: userTenantError } = await supabase
      .from('UserTenant')
      .select('*, user:User!inner(email)')
      .eq('user.email', USER_EMAIL);
    
    if (userTenantError) {
      console.error('Error checking UserTenant:', userTenantError);
    } else if (userTenantRecords && userTenantRecords.length > 0) {
      console.log('❌ Found UserTenant relationships:');
      userTenantRecords.forEach(record => {
        console.log(`  - User ID: ${record.user_id}, Tenant ID: ${record.tenant_id}, Role: ${record.role}`);
      });
    } else {
      console.log('✅ No UserTenant relationships found');
    }

    // Check tenants with subdomain "ori"
    console.log('\n🏢 Checking tenants with subdomain "ori"...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('Tenant')
      .select('*')
      .eq('subdomain', 'ori');
    
    if (tenantsError) {
      console.error('Error checking tenants:', tenantsError);
    } else if (tenants && tenants.length > 0) {
      console.log('❌ Found tenants with subdomain "ori":');
      tenants.forEach(tenant => {
        console.log(`  - ID: ${tenant.id}, Name: ${tenant.name}, Subdomain: ${tenant.subdomain}`);
      });
    } else {
      console.log('✅ No tenants with subdomain "ori"');
    }

    console.log('\n🎯 Summary complete!');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

findAllOriUsers(); 