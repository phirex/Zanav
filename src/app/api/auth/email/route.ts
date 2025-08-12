import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const { email, type = "magiclink", redirectTo } = await req.json();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.admin.generateLink({
      type,
      email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error || !data?.properties?.action_link) {
      return NextResponse.json({ error: error?.message || "failed to generate link" }, { status: 500 });
    }

    const link = data.properties.action_link;
    const html = `
      <div style="font-family:sans-serif">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email and sign in.</p>
        <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Verify and Sign In</a></p>
        <p>If the button doesn't work, copy and paste this URL into your browser:<br/>${link}</p>
      </div>
    `;

    await sendEmail({ to: email, subject: "Verify your email", html });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
