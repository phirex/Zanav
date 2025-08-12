export function baseEmailTemplate({ title, preview, contentHtml }: { title: string; preview?: string; contentHtml: string }) {
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
      .brand{color:#fff;font-weight:800;font-size:20px;letter-spacing:.3px}
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
          <div class="brand">ZANAV</div>
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
  const { kennelName, subdomain, customerName, dogs, startDate, endDate, totalFormatted } = params;
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
  return baseEmailTemplate({ title: "We received your booking request 🐶", preview: `Pending booking at ${kennelName}`, contentHtml: content });
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
}) {
  const { kennelName, customerName, customerEmail, customerPhone, dogs, startDate, endDate, totalFormatted } = params;
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
    <div style="margin-top:24px">
      <a href="https://www.zanav.io" class="btn">Open Dashboard</a>
    </div>
    <p style="margin-top:12px" class="muted">Give the pack a heads‑up—new paws arriving soon.</p>
  `;
  return baseEmailTemplate({ title: "New booking request 🐕", preview: `${customerName} requested a booking`, contentHtml: content });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
