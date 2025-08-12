"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const resend = async () => {
    try {
      setSending(true);
      setError(null);
      const email = emailFromQuery;
      if (!email) {
        setError("Missing email");
        setSending(false);
        return;
      }
      const redirectTo = new URL('/auth/callback?next=/kennel-setup', window.location.origin).toString();
      const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Failed to resend email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold mb-2">Check your inbox</h1>
        <p className="text-gray-600 mb-4">We sent a verification link to {emailFromQuery || "your email"}. Please verify to continue.</p>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {sent && <div className="mb-3 text-sm text-green-600">Verification email sent.</div>}
        <button onClick={resend} disabled={sending} className="w-full rounded bg-blue-600 text-white py-2 disabled:bg-blue-300">{sending ? 'Sending…' : 'Resend verification email'}</button>
      </div>
    </div>
  );
}
