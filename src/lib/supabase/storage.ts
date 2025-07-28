import { createClient } from "@supabase/supabase-js";

const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;
const storageAnonKey = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ANON_KEY;

if (!storageUrl || !storageAnonKey) {
  throw new Error("Missing Supabase storage environment variables");
}

// Client-side storage client (for browser)
export const supabaseStorage = createClient(storageUrl, storageAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Server-side storage client (for API routes)
export const supabaseStorageServer = () => {
  // For remote storage, we need to use the remote service role key
  const serviceKey =
    process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing service role key for server storage operations");
  }

  return createClient(storageUrl!, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const KENNEL_WEBSITE_BUCKET = "kennel-website-images";
