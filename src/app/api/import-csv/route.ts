import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";
import { promises as fs } from "fs";
import path from "path";
// @ts-ignore – csv-parse types may not be present
import { parse } from "csv-parse/sync";

interface CsvRow {
  [key: string]: string;
}

async function importOwners(
  tenantId: string,
  admin: ReturnType<typeof supabaseAdmin>,
  rows: CsvRow[],
) {
  if (!rows.length) return 0;
  const upsertRows = rows.map((r) => ({
    id: r.id ? Number(r.id) : undefined,
    name: r.name,
    email: r.email || null,
    phone: r.phone || null,
    address: r.address || null,
    clientSourceId: r.clientSourceId ? Number(r.clientSourceId) : null,
    tenantId,
  }));
  const { error } = await admin
    .from("Owner")
    .upsert(upsertRows, { onConflict: "id" });
  if (error) throw error;
  return upsertRows.length;
}

async function importClientSources(
  tenantId: string,
  admin: ReturnType<typeof supabaseAdmin>,
  rows: CsvRow[],
) {
  if (!rows.length) return 0;
  const toInsert = rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    tenantId,
  }));
  const { error } = await admin
    .from("ClientSource")
    .upsert(toInsert, { onConflict: "tenantId,id" });
  if (error) throw error;
  return toInsert.length;
}

async function importRooms(
  tenantId: string,
  admin: ReturnType<typeof supabaseAdmin>,
  rows: CsvRow[],
) {
  if (!rows.length) return 0;
  const mapped = rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    displayName: r.displayName,
    capacity: Number(r.capacity) || 0,
    maxCapacity: Number(r.maxCapacity) || 0,
    tenantId,
  }));
  const { error } = await admin
    .from("Room")
    .upsert(mapped, { onConflict: "id" });
  if (error) throw error;
  return mapped.length;
}

async function importDogs(
  tenantId: string,
  admin: ReturnType<typeof supabaseAdmin>,
  rows: CsvRow[],
) {
  if (!rows.length) return 0;
  const dogs = rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    breed: r.breed,
    specialNeeds: r.specialNeeds || null,
    ownerId: r.ownerId ? Number(r.ownerId) : null,
    currentRoomId: r.currentRoomId ? Number(r.currentRoomId) : null,
    tenantId,
  }));
  const { error } = await admin.from("Dog").upsert(dogs, { onConflict: "id" });
  if (error) throw error;
  return dogs.length;
}

async function importBookings(
  tenantId: string,
  admin: ReturnType<typeof supabaseAdmin>,
  rows: CsvRow[],
) {
  if (!rows.length) return 0;
  const mapped = rows.map((r) => ({
    id: Number(r.id),
    dogId: r.dogId ? Number(r.dogId) : null,
    roomId: r.roomId ? Number(r.roomId) : null,
    ownerId: r.ownerId ? Number(r.ownerId) : null,
    startDate: r.startDate,
    endDate: r.endDate,
    priceType: r.priceType?.toUpperCase() || "DAILY",
    pricePerDay: r.pricePerDay ? Number(r.pricePerDay) : null,
    totalPrice: r.totalPrice ? Number(r.totalPrice) : null,
    paymentMethod: r.paymentMethod || null,
    status: r.status || "CONFIRMED",
    exemptLastDay: r.exemptLastDay === "true" ? true : false,
    tenantId,
  }));
  const { error } = await admin
    .from("Booking")
    .upsert(mapped, { onConflict: "id" });
  if (error) throw error;
  return mapped.length;
}

async function importPayments(
  tenantId: string,
  admin: ReturnType<typeof supabaseAdmin>,
  rows: CsvRow[],
) {
  if (!rows.length) return 0;
  const mapped = rows.map((r) => ({
    id: Number(r.id),
    bookingId: Number(r.bookingId),
    amount: Number(r.amount),
    method: r.method,
    tenantId,
  }));
  const { error } = await admin
    .from("Payment")
    .upsert(mapped, { onConflict: "id" });
  if (error) throw error;
  return mapped.length;
}

async function importNotificationTemplates(
  tenantId: string,
  admin: ReturnType<typeof supabaseAdmin>,
  rows: CsvRow[],
) {
  if (!rows.length) return 0;
  const mapped = rows
    .filter((r) => r.id && !isNaN(Number(r.id)))
    .map((r) => ({ ...r, id: Number(r.id), tenantId }));
  console.log(
    `[IMPORT] Skipped ${rows.length - mapped.length} templates without valid id`,
  );
  const { error } = await admin
    .from("NotificationTemplate")
    .upsert(mapped, { onConflict: "id" });
  if (error) throw error;
  return mapped.length;
}

async function importSettings(
  tenantId: string,
  admin: ReturnType<typeof supabaseAdmin>,
  rows: CsvRow[],
) {
  if (!rows.length) return 0;
  const mapped = rows.map((r) => ({
    tenantId,
    key: r.key,
    value: r.value,
  }));
  const { error } = await admin
    .from("Setting")
    .upsert(mapped, { onConflict: "tenantId,key" });
  if (error) throw error;
  return mapped.length;
}

export const POST = createHandler(async ({ tenantId }) => {
  if (!tenantId) throw new Error("No tenant context");

  const admin = supabaseAdmin();
  const dataDir = path.join(process.cwd(), "data");

  const readCsv = async (file: string) => {
    try {
      const raw = await fs.readFile(path.join(dataDir, file), "utf8");
      return parse(raw, { columns: true, skip_empty_lines: true }) as CsvRow[];
    } catch {
      return [];
    }
  };

  let roomsImported = 0,
    sourcesImported = 0,
    ownersImported = 0,
    dogsImported = 0,
    bookingsImported = 0,
    paymentsImported = 0,
    templatesImported = 0,
    settingsImported = 0;

  const step = async (label: string, fn: () => Promise<number>) => {
    try {
      const n = await fn();
      console.log(`[IMPORT] ${label}: ${n}`);
      return n;
    } catch (err: any) {
      console.error(`[IMPORT] Failed at ${label}:`, err.message);
      throw new Error(`${label} import failed: ${err.message}`);
    }
  };

  roomsImported = await step("rooms", async () =>
    importRooms(tenantId, admin, await readCsv("rooms.csv")),
  );
  sourcesImported = await step("client_sources", async () =>
    importClientSources(tenantId, admin, await readCsv("client_sources.csv")),
  );
  ownersImported = await step("owners", async () =>
    importOwners(tenantId, admin, await readCsv("owners.csv")),
  );
  dogsImported = await step("dogs", async () =>
    importDogs(tenantId, admin, await readCsv("dogs.csv")),
  );
  bookingsImported = await step("bookings", async () =>
    importBookings(tenantId, admin, await readCsv("bookings.csv")),
  );
  paymentsImported = await step("payments", async () =>
    importPayments(tenantId, admin, await readCsv("payments.csv")),
  );
  templatesImported = await step("templates", async () =>
    importNotificationTemplates(
      tenantId,
      admin,
      await readCsv("notification_templates.csv"),
    ),
  );
  settingsImported = await step("settings", async () =>
    importSettings(tenantId, admin, await readCsv("settings.csv")),
  );

  return {
    success: true,
    summary: {
      rooms: roomsImported,
      clientSources: sourcesImported,
      owners: ownersImported,
      dogs: dogsImported,
      bookings: bookingsImported,
      payments: paymentsImported,
      templates: templatesImported,
      settings: settingsImported,
    },
  };
});
