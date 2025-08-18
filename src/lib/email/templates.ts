export function baseEmailTemplate({
  title,
  preview,
  contentHtml,
}: {
  title: string;
  preview?: string;
  contentHtml: string;
}) {
  // Use full white logo PNG hosted under /public/images
  const logoUrl = "https://www.zanav.io/images/logo-white.png";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body{margin:0;background:#f6f7fb;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif}
      .container{max-width:640px;margin:0 auto;padding:24px}
      .card{background:#ffffff;border-radius:14px;box-shadow:0 1px 2px rgba(16,24,40,0.04),0 1px 3px rgba(16,24,40,0.1);overflow:hidden}
      .header{background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px}
      .brand{display:flex;align-items:center;gap:12px;margin-bottom:6px}
      .brand img{height:24px}
      .title{margin:0;color:#fff;font-weight:700;font-size:22px}
      .content{padding:24px}
      .muted{color:#64748b}
      .btn{display:inline-block;background:#2563eb;color:#fff !important;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600}
      .divider{height:1px;background:#e5e7eb;margin:24px 0}
      .footer{color:#94a3b8;font-size:12px;text-align:center;margin-top:16px}
      .pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-weight:600;font-size:12px}
      .price{font-weight:800;font-size:18px}
    </style>
  </head>
  <body>
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${preview ? escapeHtml(preview) : ""}</span>
    <div class="container">
      <div class="card">
        <div class="header">
          <div class="brand"><img src="${logoUrl}" alt="Zanav" /></div>
          <p class="title">${escapeHtml(title)}</p>
        </div>
        <div class="content">
          ${contentHtml}
          <div class="divider"></div>
          <p class="muted" style="margin:0">You’re receiving this email because you interacted with a kennel using Zanav. If you didn’t expect this, you can ignore it.</p>
        </div>
      </div>
      <p class="footer">© ${new Date().getFullYear()} Zanav • All rights reserved</p>
    </div>
  </body>
</html>`;
}

export function bookingRequestCustomerEmail(params: {
  kennelName: string;
  subdomain: string;
  customerName: string;
  dogs: string[];
  startDate: string;
  endDate: string;
  totalFormatted: string;
}) {
  const {
    kennelName,
    subdomain,
    customerName,
    dogs,
    startDate,
    endDate,
    totalFormatted,
  } = params;
  const content = `
    <p>Hi ${escapeHtml(customerName)} 🐾</p>
    <p>We’ve fetched your booking request at <strong>${escapeHtml(kennelName)}</strong> and our team is wagging into action.</p>
    <p class="muted" style="margin-top:12px">A human will review the dates and give you a paws‑itive confirmation shortly.</p>
    <div style="margin-top:16px">
      <span class="pill">Pending Confirmation</span>
    </div>
    <div style="margin-top:20px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td class="muted">Check‑in</td>
          <td align="right">${escapeHtml(startDate)}</td>
        </tr>
        <tr>
          <td class="muted">Check‑out</td>
          <td align="right">${escapeHtml(endDate)}</td>
        </tr>
        <tr>
          <td class="muted">Dogs</td>
          <td align="right">${escapeHtml(dogs.join(", "))}</td>
        </tr>
        <tr>
          <td class="muted">Estimated total</td>
          <td align="right" class="price">${escapeHtml(totalFormatted)}</td>
        </tr>
      </table>
    </div>
    <div style="margin-top:24px">
      <a href="https://${escapeHtml(subdomain)}.zanav.io" class="btn">Visit Kennel Website</a>
    </div>
    <p style="margin-top:12px" class="muted">Tip: Bring a favorite toy—tails tend to wag extra fast on check‑in day.</p>
  `;
  return baseEmailTemplate({
    title: "We received your booking request 🐶",
    preview: `Pending booking at ${kennelName}`,
    contentHtml: content,
  });
}

export function bookingNotificationOwnerEmail(params: {
  kennelName: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  dogs: string[];
  startDate: string;
  endDate: string;
  totalFormatted: string;
  requestNote?: string;
}) {
  const {
    kennelName,
    customerName,
    customerEmail,
    customerPhone,
    dogs,
    startDate,
    endDate,
    totalFormatted,
    requestNote,
  } = params;
  const contact = [customerPhone, customerEmail].filter(Boolean).join(" · ");
  const content = `
    <p>New booking request for <strong>${escapeHtml(kennelName)}</strong> 🐾</p>
    <div style="margin-top:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td class="muted">Customer</td>
          <td align="right">${escapeHtml(customerName)} (${escapeHtml(contact)})</td>
        </tr>
        <tr>
          <td class="muted">Dates</td>
          <td align="right">${escapeHtml(startDate)} → ${escapeHtml(endDate)}</td>
        </tr>
        <tr>
          <td class="muted">Dogs</td>
          <td align="right">${escapeHtml(dogs.join(", "))}</td>
        </tr>
        <tr>
          <td class="muted">Estimated total</td>
          <td align="right" class="price">${escapeHtml(totalFormatted)}</td>
        </tr>
      </table>
    </div>
    ${
      requestNote
        ? `<div style="margin-top:16px">
      <div style="font-weight:700;margin-bottom:6px">Customer note</div>
      <div style="white-space:pre-wrap" class="muted">${escapeHtml(requestNote)}</div>
    </div>`
        : ""
    }
    <div style="margin-top:24px">
      <a href="https://www.zanav.io" class="btn">Open Dashboard</a>
    </div>
    <p style="margin-top:12px" class="muted">Give the pack a heads‑up—new paws arriving soon.</p>
  `;
  return baseEmailTemplate({
    title: "New booking request 🐕",
    preview: `${customerName} requested a booking`,
    contentHtml: content,
  });
}

export function bookingConfirmedCustomerEmail(params: {
  kennelName: string;
  customerName: string;
  dogs: string[];
  startDate: string;
  endDate: string;
  totalFormatted?: string;
  note?: string;
}) {
  const {
    kennelName,
    customerName,
    dogs,
    startDate,
    endDate,
    totalFormatted,
    note,
  } = params;
  const content = `
    <p>Hi ${escapeHtml(customerName)} 🐶</p>
    <p>Your booking at <strong>${escapeHtml(kennelName)}</strong> is confirmed.</p>
    <div style="margin-top:20px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td class="muted">Check‑in</td>
          <td align="right">${escapeHtml(startDate)}</td>
        </tr>
        <tr>
          <td class="muted">Check‑out</td>
          <td align="right">${escapeHtml(endDate)}</td>
        </tr>
        <tr>
          <td class="muted">Dogs</td>
          <td align="right">${escapeHtml(dogs.join(", "))}</td>
        </tr>
        ${totalFormatted ? `<tr><td class="muted">Estimated total</td><td align="right" class="price">${escapeHtml(totalFormatted)}</td></tr>` : ""}
      </table>
    </div>
    ${
      note
        ? `<div style="margin-top:16px">
      <div style="font-weight:700;margin-bottom:6px">Note from ${escapeHtml(kennelName)}</div>
      <div style=\"white-space:pre-wrap\" class=\"muted\">${escapeHtml(note)}</div>
    </div>`
        : ""
    }
    <p style="margin-top:12px" class="muted">If you need to change anything, just reply to this email.</p>
  `;
  return baseEmailTemplate({
    title: "Booking confirmed ✅",
    preview: `Confirmed at ${kennelName}`,
    contentHtml: content,
  });
}

export function bookingCancelledCustomerEmail(params: {
  kennelName: string;
  customerName: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const { kennelName, customerName, startDate, endDate, reason } = params;
  const content = `
    <p>Hi ${escapeHtml(customerName)}</p>
    <p>We’re sorry—your booking at <strong>${escapeHtml(kennelName)}</strong> was cancelled.</p>
    <div style="margin-top:12px" class="muted">
      <div>Dates: ${escapeHtml(startDate)} → ${escapeHtml(endDate)}</div>
      ${reason ? `<div>Reason: ${escapeHtml(reason)}</div>` : ""}
    </div>
    <p style="margin-top:12px" class="muted">If this was a mistake, reply and we’ll help.</p>
  `;
  return baseEmailTemplate({
    title: "Booking cancelled",
    preview: `Cancelled at ${kennelName}`,
    contentHtml: content,
  });
}

export function paymentReceiptCustomerEmail(params: {
  kennelName: string;
  customerName: string;
  amountFormatted: string;
  dogs: string[];
  startDate?: string;
  endDate?: string;
  balanceFormatted?: string;
}) {
  const {
    kennelName,
    customerName,
    amountFormatted,
    dogs,
    startDate,
    endDate,
    balanceFormatted,
  } = params;
  const content = `
    <p>Hi ${escapeHtml(customerName)} 🧾</p>
    <p>We received your payment at <strong>${escapeHtml(
      kennelName,
    )}</strong>.</p>
    <div style="margin-top:12px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr><td class="muted">Amount</td><td align="right" class="price">${escapeHtml(
          amountFormatted,
        )}</td></tr>
        <tr><td class="muted">Dogs</td><td align="right">${escapeHtml(
          dogs.join(", "),
        )}</td></tr>
        ${
          startDate && endDate
            ? `<tr><td class="muted">Dates</td><td align="right">${escapeHtml(
                startDate,
              )} → ${escapeHtml(endDate)}</td></tr>`
            : ""
        }
        ${
          balanceFormatted
            ? `<tr><td class="muted">Remaining balance</td><td align="right">${escapeHtml(
                balanceFormatted,
              )}</td></tr>`
            : ""
        }
      </table>
    </div>
    <p class="muted" style="margin-top:12px">Thank you for choosing ${escapeHtml(
      kennelName,
    )}.</p>
  `;
  return baseEmailTemplate({
    title: "Payment receipt",
    preview: `Payment received at ${kennelName}`,
    contentHtml: content,
  });
}

export function checkInReminderCustomerEmail(params: {
  kennelName: string;
  customerName: string;
  dogs: string[];
  startDate: string;
  startTime?: string;
  hoursBefore: number; // 72 or 24
}) {
  const { kennelName, customerName, dogs, startDate, startTime, hoursBefore } =
    params;
  const content = `
    <p>Hi ${escapeHtml(customerName)} 👋</p>
    <p>Friendly reminder: your check‑in at <strong>${escapeHtml(kennelName)}</strong> is in <strong>${hoursBefore} hours</strong>.</p>
    <div style="margin-top:12px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr><td class="muted">Date</td><td align="right">${escapeHtml(startDate)}${startTime ? `, ${escapeHtml(startTime)}` : ""}</td></tr>
        <tr><td class="muted">Dogs</td><td align="right">${escapeHtml(dogs.join(", "))}</td></tr>
      </table>
    </div>
    <p class="muted" style="margin-top:12px">If you need to make changes, reply to this email.</p>
  `;
  return baseEmailTemplate({
    title: `Check‑in reminder (${hoursBefore}h)`,
    preview: `Check‑in in ${hoursBefore} hours at ${kennelName}`,
    contentHtml: content,
  });
}

export function checkOutReminderCustomerEmail(params: {
  kennelName: string;
  customerName: string;
  dogs: string[];
  endDate: string;
  endTime?: string;
}) {
  const { kennelName, customerName, dogs, endDate, endTime } = params;
  const content = `
    <p>Hi ${escapeHtml(customerName)} 👋</p>
    <p>Quick heads‑up: your check‑out from <strong>${escapeHtml(kennelName)}</strong> is tomorrow.</p>
    <div style="margin-top:12px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr><td class="muted">Date</td><td align="right">${escapeHtml(endDate)}${endTime ? `, ${escapeHtml(endTime)}` : ""}</td></tr>
        <tr><td class="muted">Dogs</td><td align="right">${escapeHtml(dogs.join(", "))}</td></tr>
      </table>
    </div>
    <p class="muted" style="margin-top:12px">We loved hosting your pup(s)! Reply if you need a later pickup.</p>
  `;
  return baseEmailTemplate({
    title: "Check‑out reminder (24h)",
    preview: `Check‑out tomorrow from ${kennelName}`,
    contentHtml: content,
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
