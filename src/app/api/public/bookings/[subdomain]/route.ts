import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import type { Database } from "@/lib/database.types";

type PaymentMethod = Database["public"]["Enums"]["PaymentMethod"];
type PriceType = Database["public"]["Enums"]["PriceType"];

enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
}

export async function POST(request: NextRequest, { params }: { params: { subdomain: string } }) {
  try {
    const supabase = supabaseServer();
    const body = await request.json();

    const { data: website } = await supabase
      .from("kennel_websites")
      .select("id, tenant_id, contact_email, subdomain")
      .eq("subdomain", params.subdomain)
      .single();
    if (!website) return NextResponse.json({ error: "Kennel not found" }, { status: 404 });

    const tenantId = website.tenant_id;

    const { startDate, endDate, ownerName, ownerEmail, ownerPhone, dogs } = body || {};
    if (!startDate || !endDate || !ownerName || !ownerPhone || !Array.isArray(dogs) || dogs.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Settings for price & currency
    const { data: settingsRows } = await supabase
      .from("Setting")
      .select("key,value")
      .eq("tenantId", tenantId);
    const settings = new Map((settingsRows || []).map((r: any) => [r.key, r.value]));
    const pricePerDay = parseFloat(settings.get("default_price_per_day") || "0") || 0;
    const currency = (settings.get("default_currency") || "usd").toLowerCase();

    // Create owner
    const { data: ownerRow, error: ownerErr } = await supabase
      .from("Owner")
      .insert({ name: ownerName, email: ownerEmail || null, phone: ownerPhone, tenantId })
      .select("id")
      .single();
    if (ownerErr) return NextResponse.json({ error: ownerErr.message }, { status: 400 });

    // Create dogs
    const dogRows = dogs.map((d: any) => ({ name: d.name, breed: d.breed || "", specialNeeds: "", ownerId: ownerRow!.id, tenantId }));
    const { data: insertedDogs, error: dogErr } = await supabase
      .from("Dog")
      .insert(dogRows)
      .select("id");
    if (dogErr) return NextResponse.json({ error: dogErr.message }, { status: 400 });

    // Pick any available room for now (first room)
    const { data: room } = await supabase.from("Room").select("id").eq("tenantId", tenantId).order("id").limit(1).single();
    if (!room) return NextResponse.json({ error: "No rooms configured" }, { status: 400 });

    // Calculate per-dog price
    const days = Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000*60*60*24)));
    const perDogTotal = pricePerDay > 0 ? pricePerDay * days : null;

    const priceType: PriceType = "DAILY";
    const paymentMethod: PaymentMethod = "CASH";
    const status: Database["public"]["Enums"]["BookingStatus"] = "PENDING";

    // Create one booking row per dog
    const bookingRows: Database["public"]["Tables"]["Booking"]["Insert"][] = insertedDogs!.map((d: any) => ({
      dogId: d.id,
      roomId: room.id,
      ownerId: ownerRow!.id,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      priceType,
      pricePerDay: pricePerDay > 0 ? pricePerDay : null,
      totalPrice: perDogTotal,
      paymentMethod,
      status,
      tenantId,
    }));

    const { data: created, error: bookErr } = await supabase.from("Booking").insert(bookingRows).select("id");
    if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 400 });

    // Emails
    const totalAll = perDogTotal ? perDogTotal * insertedDogs!.length : 0;
    const subject = `New booking request on ${params.subdomain}`;
    const htmlOwner = `<p>You received a new booking request.</p><p>Customer: ${ownerName} (${ownerPhone}${ownerEmail ? ", " + ownerEmail : ""})</p><p>Dates: ${startDate} → ${endDate}</p><p>Dogs: ${dogs.map((d:any)=>d.name).join(", ")}</p><p>Estimated total: ${totalAll} ${currency.toUpperCase()}</p>`;
    const htmlCustomer = `<p>Thanks for your request at ${params.subdomain}. We will confirm shortly.</p><p>Dates: ${startDate} → ${endDate}</p><p>Dogs: ${dogs.map((d:any)=>d.name).join(", ")}</p>`;

    try {
      if (website.contact_email) await sendEmail({ to: website.contact_email, subject, html: htmlOwner });
      if (ownerEmail) await sendEmail({ to: ownerEmail, subject: "We received your booking request", html: htmlCustomer });
    } catch (e) {
      console.warn("Email send failed", e);
    }

    return NextResponse.json({ success: true, bookingIds: created!.map((b:any)=>b.id) });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
