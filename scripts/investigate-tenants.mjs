import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigate() {
  console.log('🔍 Investigating tenant assignments...\n');
  
  try {
    // Check all users and their tenant relationships
    console.log('1. All Users:');
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, email, supabaseUserId, tenantId, createdAt')
      .order('createdAt', { ascending: false });
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`);
      console.log(`    SupabaseUID: ${user.supabaseUserId}`);
      console.log(`    TenantID: ${user.tenantId || 'NULL'}`);
      console.log(`    Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Check UserTenant relationships
    console.log('2. UserTenant Relationships:');
    const { data: userTenants, error: utError } = await supabase
      .from('UserTenant')
      .select('id, user_id, tenant_id, role, created_at')
      .order('created_at', { ascending: false });
    
    if (utError) {
      console.error('Error fetching user tenants:', utError);
      return;
    }
    
    userTenants.forEach(ut => {
      console.log(`  - UserID: ${ut.user_id} -> TenantID: ${ut.tenant_id} (Role: ${ut.role})`);
    });
    
    // Check all tenants
    console.log('\n3. All Tenants:');
    const { data: tenants, error: tenantsError } = await supabase
      .from('Tenant')
      .select('id, name, subdomain, createdAt')
      .order('createdAt', { ascending: false });
    
    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return;
    }
    
    tenants.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.id})`);
      console.log(`    Subdomain: ${tenant.subdomain || 'No subdomain'}`);
      console.log(`    Created: ${tenant.createdAt}`);
      console.log('');
    });
    
    // Check specific users
    console.log('4. Specific User Investigation:');
    
    // Find phirex@gmail.com user
    const phirexUser = users.find(u => u.email === 'phirex@gmail.com');
    if (phirexUser) {
      console.log('phirex@gmail.com:');
      console.log(`  User ID: ${phirexUser.id}`);
      console.log(`  SupabaseUID: ${phirexUser.supabaseUserId}`);
      console.log(`  Current TenantID: ${phirexUser.tenantId || 'NULL'}`);
      
      // Find UserTenant relationships for phirex
      const phirexUTs = userTenants.filter(ut => ut.user_id === phirexUser.id);
      console.log(`  UserTenant relationships: ${phirexUTs.length}`);
      phirexUTs.forEach(ut => {
        console.log(`    - TenantID: ${ut.tenant_id} (Role: ${ut.role})`);
      });
      
      // Find the specific tenant that phirex is assigned to
      if (phirexUser.tenantId) {
        const assignedTenant = tenants.find(t => t.id === phirexUser.tenantId);
        if (assignedTenant) {
          console.log(`  Currently assigned to: ${assignedTenant.name} (${assignedTenant.subdomain || 'No subdomain'})`);
        }
      }
    }
    
    // Find orilevi@gmail.com user
    const orileviUser = users.find(u => u.email === 'orilevi@gmail.com');
    if (orileviUser) {
      console.log('\norilevi@gmail.com:');
      console.log(`  User ID: ${orileviUser.id}`);
      console.log(`  SupabaseUID: ${orileviUser.supabaseUserId}`);
      console.log(`  Current TenantID: ${orileviUser.tenantId || 'NULL'}`);
      
      // Find UserTenant relationships for orilevi
      const orileviUTs = userTenants.filter(ut => ut.user_id === orileviUser.id);
      console.log(`  UserTenant relationships: ${orileviUTs.length}`);
      orileviUTs.forEach(ut => {
        console.log(`    - TenantID: ${ut.tenant_id} (Role: ${ut.role})`);
      });
      
      // Find the specific tenant that orilevi is assigned to
      if (orileviUser.tenantId) {
        const assignedTenant = tenants.find(t => t.id === orileviUser.tenantId);
        if (assignedTenant) {
          console.log(`  Currently assigned to: ${assignedTenant.name} (${assignedTenant.subdomain || 'No subdomain'})`);
        }
      }
    }
    
    // Check for any orphaned or conflicting assignments
    console.log('\n5. Potential Issues:');
    
    // Users with no tenantId
    const usersWithoutTenant = users.filter(u => !u.tenantId);
    if (usersWithoutTenant.length > 0) {
      console.log('  Users without tenantId:');
      usersWithoutTenant.forEach(u => console.log(`    - ${u.email}`));
    }
    
    // Users with tenantId but no UserTenant relationship
    const usersWithTenantButNoUT = users.filter(u => {
      if (!u.tenantId) return false;
      return !userTenants.some(ut => ut.user_id === u.id && ut.tenant_id === u.tenantId);
    });
    
    if (usersWithTenantButNoUT.length > 0) {
      console.log('  Users with tenantId but no UserTenant relationship:');
      usersWithTenantButNoUT.forEach(u => console.log(`    - ${u.email} (TenantID: ${u.tenantId})`));
    }
    
    // Check GlobalAdmin table
    console.log('\n6. Global Admin Status:');
    const { data: globalAdmins, error: gaError } = await supabase
      .from('GlobalAdmin')
      .select('*');
    
    if (gaError) {
      console.error('Error fetching global admins:', gaError);
    } else {
      globalAdmins.forEach(ga => {
        console.log(`  - ${ga.email} (${ga.supabaseUserId})`);
      });
    }
    
  } catch (error) {
    console.error('Error during investigation:', error);
  }
}

investigate();
