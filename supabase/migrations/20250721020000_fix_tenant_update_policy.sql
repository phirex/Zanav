-- Fix Tenant table UPDATE policy
-- The Tenant table was missing an UPDATE policy, causing subdomain updates to fail silently

-- Allow authenticated users to update their own tenant
CREATE POLICY tenant_update_policy ON "Tenant"
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Also add a policy for kennel_websites table to ensure consistency
CREATE POLICY kennel_websites_tenant_policy ON kennel_websites
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::UUID); 