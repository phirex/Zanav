import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type TriggerType = Database["public"]["Enums"]["TriggerType"];

export async function listTemplates(
  client: SupabaseClient<Database>,
  tenantId: string,
) {
  let query = client
    .from("NotificationTemplate")
    .select("*")
    .order("name");
  
  if (tenantId) {
    query = query.eq("tenantId", tenantId);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export interface TemplateDTO {
  name: string;
  subject: string;
  body: string;
  trigger: TriggerType;
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
  let query = client
    .from("NotificationTemplate")
    .select("*")
    .eq("id", id);
  
  if (tenantId) {
    query = query.eq("tenantId", tenantId);
  }
  
  const { data, error } = await query.maybeSingle();
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
  let query = client
    .from("NotificationTemplate")
    .update(dto)
    .eq("id", id);
  
  if (tenantId) {
    query = query.eq("tenantId", tenantId);
  }
  
  const { data, error } = await query.select().single();
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
  // delete scheduled notifications first
  let scheduledQuery = client.from("ScheduledNotification").delete().eq("templateId", id);
  if (tenantId) {
    scheduledQuery = scheduledQuery.eq("tenantId", tenantId);
  }
  await scheduledQuery;
  
  let templateQuery = client
    .from("NotificationTemplate")
    .delete()
    .eq("id", id);
  
  if (tenantId) {
    templateQuery = templateQuery.eq("tenantId", tenantId);
  }
  
  const { error } = await templateQuery;
  if (error) throw new Error(error.message);
  return { success: true };
}
