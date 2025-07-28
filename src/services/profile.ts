import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function getProfile(
  client: SupabaseClient<Database>,
  supabaseUserId: string,
) {
  const { data, error } = await client
    .from("User")
    .select('id, email, name, firstName, lastName, "createdAt", "updatedAt"')
    .eq("supabaseUserId", supabaseUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Profile not found");
  return data;
}

interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  name?: string;
}

export async function updateProfile(
  client: SupabaseClient<Database>,
  supabaseUserId: string,
  { firstName, lastName, name }: UpdateProfileInput,
) {
  const { data: userRecord, error: fetchErr } = await client
    .from("User")
    .select("id")
    .eq("supabaseUserId", supabaseUserId)
    .maybeSingle();
  if (fetchErr || !userRecord) throw new Error("User not found");

  const fullName = name || `${firstName ?? ""} ${lastName ?? ""}`.trim();

  const { error: updErr } = await client
    .from("User")
    .update({
      firstName,
      lastName,
      name: fullName,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userRecord.id);
  if (updErr) {
    console.error("[updateProfile] Database update error:", updErr);
    throw new Error(updErr.message);
  }

  // also update auth metadata (suppress error)
  try {
    await client.auth.updateUser({
      data: { firstName, lastName, name: fullName },
    });
  } catch (authErr) {
    console.warn("[updateProfile] Auth metadata update failed:", authErr);
  }

  return { success: true };
}
