import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body || {};
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: "to, subject, and html/text required" }, { status: 400 });
    }
    await sendEmail({ to, subject, html, text });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 });
  }
}
