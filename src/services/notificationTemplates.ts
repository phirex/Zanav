import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export async function listTemplates(
  client: SupabaseClient<Database>,
  tenantId: string,
) {
  if (tenantId) {
    try {
      await client.rpc("set_tenant", { _tenant_id: tenantId });
    } catch {}
  }
  const { data, error } = await client
    .from("NotificationTemplate")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export interface TemplateDTO {
  name: string;
  subject: string;
  body: string;
  trigger: string;
  description?: string;
  delayHours?: number;
  active?: boolean;
}

export async function createTemplate(
  client: SupabaseClient<Database>,
  tenantId: string,
  dto: TemplateDTO,
) {
  const required = ["name", "subject", "body", "trigger"] as const;
  for (const key of required) {
    // @ts-ignore dynamic
    if (!dto[key]) throw new Error(`Missing required field: ${key}`);
  }
  if (tenantId) {
    try {
      await client.rpc("set_tenant", { _tenant_id: tenantId });
    } catch {}
  }
  const { data, error } = await client
    .from("NotificationTemplate")
    .insert({
      ...dto,
      tenantId,
      delayHours: dto.delayHours || 0,
      active: dto.active ?? true,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505")
      throw new Error("Template with this name exists");
    throw new Error(error.message);
  }
  return data;
}

export async function getTemplate(
  client: SupabaseClient<Database>,
  tenantId: string,
  id: string,
) {
  if (tenantId) {
    try {
      await client.rpc("set_tenant", { _tenant_id: tenantId });
    } catch {}
  }
  const { data, error } = await client
    .from("NotificationTemplate")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Template not found");
  return data;
}

export async function updateTemplate(
  client: SupabaseClient<Database>,
  tenantId: string,
  id: string,
  dto: Partial<TemplateDTO>,
) {
  if (tenantId) {
    try {
      await client.rpc("set_tenant", { _tenant_id: tenantId });
    } catch {}
  }
  const { data, error } = await client
    .from("NotificationTemplate")
    .update(dto)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (error.code === "23505")
      throw new Error("Template with this name exists");
    throw new Error(error.message);
  }
  return data;
}

export async function deleteTemplate(
  client: SupabaseClient<Database>,
  tenantId: string,
  id: string,
) {
  if (tenantId) {
    try {
      await client.rpc("set_tenant", { _tenant_id: tenantId });
    } catch {}
  }
  // delete scheduled notifications first
  await client.from("ScheduledNotification").delete().eq("templateId", id);
  const { error } = await client
    .from("NotificationTemplate")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}
