import { Resend } from "resend";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string; // fallback to env
  replyTo?: string;
}

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    client = new Resend(apiKey);
  }
  return client;
}

export async function sendEmail({ to, subject, html, text, from, replyTo }: SendEmailInput) {
  const sender = from || process.env.EMAIL_FROM || "Zanav <notifications@zanav.io>";
  const payload: any = { from: sender, to, subject };
  if (replyTo) payload.reply_to = replyTo;
  if (html) payload.html = html;
  if (text) payload.text = text;

  const resend = getClient();
  const { error } = await resend.emails.send(payload);
  if (error) throw error;
}
