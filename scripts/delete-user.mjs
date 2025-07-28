#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// User to delete
const USER_EMAIL = 'ori@walla.com';
const USER_ID = '9cdb8a28-b6b1-4db6-b03e-f5398e0c3f2f';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deleteUserCompletely() {
  try {
    console.log(`🔍 Starting deletion process for user: ${USER_EMAIL} (${USER_ID})`);

    // Step 1: Find internal User record
    console.log('\n📋 Step 1: Finding internal User record...');
    const { data: internalUser, error: userError } = await supabase
      .from('User')
      .select('id, email, name')
      .eq('supabaseUserId', USER_ID)
      .maybeSingle();

    if (userError) {
      console.warn('⚠️  Error finding internal user:', userError.message);
    } else if (internalUser) {
      console.log('✅ Found internal user:', internalUser);

      // Step 2: Delete from UserTenant relationships
      console.log('\n🔗 Step 2: Removing tenant relationships...');
      const { error: tenantLinkError } = await supabase
        .from('UserTenant')
        .delete()
        .eq('user_id', internalUser.id);

      if (tenantLinkError) {
        console.warn('⚠️  Error removing tenant links:', tenantLinkError.message);
      } else {
        console.log('✅ Removed tenant relationships');
      }

      // Step 3: Delete from User table
      console.log('\n👤 Step 3: Deleting from User table...');
      const { error: deleteUserError } = await supabase
        .from('User')
        .delete()
        .eq('id', internalUser.id);

      if (deleteUserError) {
        console.warn('⚠️  Error deleting user record:', deleteUserError.message);
      } else {
        console.log('✅ Deleted user record');
      }
    } else {
      console.log('ℹ️  No internal user record found');
    }

    // Step 4: Delete from GlobalAdmin if exists
    console.log('\n👑 Step 4: Checking global admin status...');
    const { error: adminDeleteError } = await supabase
      .from('global_admin')
      .delete()
      .eq('supabaseUserId', USER_ID);

    if (adminDeleteError && adminDeleteError.code !== 'PGRST116') {
      console.warn('⚠️  Error removing admin status:', adminDeleteError.message);
    } else {
      console.log('✅ Removed admin status (if existed)');
    }

    // Step 5: Delete from Supabase Auth
    console.log('\n🔐 Step 5: Deleting from Supabase Auth...');
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(USER_ID);
      
      if (authDeleteError) {
        console.warn('⚠️  Error deleting auth user:', authDeleteError.message);
      } else {
        console.log('✅ Deleted from Supabase Auth');
      }
    } catch (authError) {
      console.warn('⚠️  Exception deleting auth user:', authError.message);
    }

    console.log('\n🎉 User deletion completed!');
    console.log('\n💡 You can now sign up fresh with the same email address.');
    
  } catch (error) {
    console.error('\n❌ Unexpected error during deletion:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteUserCompletely(); 