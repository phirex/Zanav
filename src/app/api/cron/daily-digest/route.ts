import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";

export { dynamic } from "@/lib/forceDynamic";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function GET(request: NextRequest) {
  try {
    // Auth like notifications cron
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.CRON_API_KEY;
    if (
      apiKey &&
      (!authHeader ||
        !authHeader.startsWith("Bearer ") ||
        authHeader.split(" ")[1] !== apiKey)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = supabaseAdmin();

    // Determine tomorrow window (00:00 to 23:59:59 local time)
    const now = new Date();
    const tomorrowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    );
    const tomorrowEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      23,
      59,
      59,
      999,
    );

    // Fetch websites to target recipients per tenant
    const { data: websites } = await admin
      .from("kennel_websites")
      .select("id, tenant_id, contact_email, hero_title");

    let sentCount = 0;
    for (const site of websites || []) {
      const tenantId = (site as any).tenant_id as string;
      const to = (site as any).contact_email as string | null;
      if (!tenantId || !to) continue;

      // Arrivals (startDate in window) and departures (endDate in window)
      const { data: arrivals } = await admin
        .from("Booking")
        .select(
          "id, startDate, endDate, dog:Dog(name), owner:Owner(name, phone)",
        )
        .eq("tenantId", tenantId)
        .gte("startDate", tomorrowStart.toISOString())
        .lte("startDate", tomorrowEnd.toISOString())
        .order("startDate", { ascending: true });

      const { data: departures } = await admin
        .from("Booking")
        .select(
          "id, startDate, endDate, dog:Dog(name), owner:Owner(name, phone)",
        )
        .eq("tenantId", tenantId)
        .gte("endDate", tomorrowStart.toISOString())
        .lte("endDate", tomorrowEnd.toISOString())
        .order("endDate", { ascending: true });

      if (!arrivals?.length && !departures?.length) continue;

      const table = (
        title: string,
        rows: any[] | null | undefined,
        timeField: "startDate" | "endDate",
      ) => {
        if (!rows || rows.length === 0) return "";
        const items = rows
          .map((r) => {
            const time = new Date(r[timeField]).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const dog = r.dog?.name || "Dog";
            const owner = r.owner?.name || "Owner";
            const phone = r.owner?.phone || "";
            return `<tr><td>${dog}</td><td>${owner}</td><td>${phone}</td><td align="right">${time}</td></tr>`;
          })
          .join("");
        return `
          <h3 style="margin:16px 0 8px 0">${title}</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr><th align="left">Dog</th><th align="left">Owner</th><th align="left">Phone</th><th align="right">Time</th></tr>
            ${items}
          </table>
        `;
      };

      const kennelName = (site as any).hero_title || "Your Kennel";
      const content = `
        <p>Daily arrivals/departures for <strong>${kennelName}</strong> — ${formatDate(tomorrowStart)}</p>
        ${table("Arrivals", arrivals, "startDate")}
        ${table("Departures", departures, "endDate")}
      `;

      await sendEmail({
        to,
        subject: `Daily digest — ${formatDate(tomorrowStart)}`,
        html: `<!doctype html><html><body style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">${content}</body></html>`,
      });
      sentCount++;
    }

    return NextResponse.json({ ok: true, sent: sentCount });
  } catch (e: any) {
    console.error("daily digest error", e);
    return NextResponse.json(
      { error: e?.message || "server error" },
      { status: 500 },
    );
  }
}
