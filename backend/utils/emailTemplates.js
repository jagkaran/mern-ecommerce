"use strict";
/**
 * emailTemplates.js
 *
 * HTML + plain-text email bodies for transactional messages. Theme matches
 * the frontend Hverdag design system:
 *   - Primary (terracotta): #92593f
 *   - Background (cream):   #fafaf9
 *   - Headings:  #1c1917 (stone-900)
 *   - Body text: #57534e (stone-600)
 *   - Muted:     #a8a29e (stone-400)
 *   - Headings: Georgia (serif fallback for Fraunces; Fraunces isn't
 *                installed by every email client, so we don't @import it)
 *   - Body:     -apple-system, system-ui, sans-serif
 *
 * Why table-based layout with inline styles? Outlook, Yahoo, and Gmail's
 * own web client strip <style> blocks and ignore <div> for layout. Tables
 * + inline CSS render consistently across the 8+ clients a transactional
 * email realistically reaches.
 */

const BRAND = {
  name: "Click.it Store",
  primary: "#92593f",
  primaryHover: "#7a4832",
  bg: "#fafaf9",
  surface: "#ffffff",
  border: "#e7e5e4",
  text: "#1c1917",
  textBody: "#57534e",
  muted: "#a8a29e",
  fontHeading: "Georgia, 'Times New Roman', serif",
  fontBody:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(amount, currency = "USD") {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      safeAmount
    );
  } catch {
    return `${currency} ${safeAmount.toFixed(2)}`;
  }
}

/**
 * Wrap inner HTML in the standard shell: outer 100% bg, centered card,
 * header bar, footer. Returns a complete <html> document so the email is
 * standalone even if the recipient's client blocks remote images/CSS.
 */
function shell({ title, previewText, inner }) {
  // ponytail: a 1-2 line `previewText` shows up in the inbox list preview
  // pane (Gmail, iOS Mail). Crucial for open rate — empty preview = blank.
  const preview = previewText ? escapeHtml(previewText) : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:${BRAND.fontBody};color:${BRAND.textBody};-webkit-font-smoothing:antialiased;">
<span style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preview}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.bg};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:${BRAND.primary};padding:24px 32px;">
            <span style="font-family:${BRAND.fontHeading};font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">${BRAND.name}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;font-family:${BRAND.fontBody};font-size:16px;line-height:1.6;color:${BRAND.textBody};">
            ${inner}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;border-top:1px solid ${BRAND.border};font-family:${BRAND.fontBody};font-size:13px;line-height:1.5;color:${BRAND.muted};">
            You received this because you have an account with ${BRAND.name}. If you have questions, reply to this email.
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
        <tr>
          <td align="center" style="padding:16px 32px 0;font-family:${BRAND.fontBody};font-size:12px;color:${BRAND.muted};">
            © ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function primaryButton({ href, label }) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" bgcolor="${BRAND.primary}" style="border-radius:6px;">
      <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:${BRAND.fontBody};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

// ─── Password reset ─────────────────────────────────────────────────────────

function passwordResetHtml({ name, resetUrl }) {
  const inner = `
    <h1 style="margin:0 0 16px;font-family:${BRAND.fontHeading};font-size:26px;font-weight:600;color:${BRAND.text};line-height:1.2;letter-spacing:-0.01em;">Reset your password</h1>
    <p style="margin:0 0 16px;color:${BRAND.textBody};">Hi${name ? ` ${escapeHtml(name)}` : ""},</p>
    <p style="margin:0 0 8px;color:${BRAND.textBody};">We received a request to reset the password for your ${BRAND.name} account. Click the button below to choose a new password.</p>
    ${primaryButton({ href: resetUrl, label: "Reset my password" })}
    <p style="margin:16px 0 8px;color:${BRAND.textBody};font-size:14px;">This link expires in 15 minutes and can only be used once.</p>
    <p style="margin:16px 0 8px;color:${BRAND.textBody};font-size:14px;">If the button doesn't work, paste this URL into your browser:</p>
    <p style="margin:0;padding:12px;background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:${BRAND.text};word-break:break-all;">${escapeHtml(resetUrl)}</p>
    <p style="margin:24px 0 0;color:${BRAND.textBody};font-size:14px;">If you didn't request a password reset, you can safely ignore this email — your password will stay the same.</p>
  `;
  return shell({
    title: `Reset your ${BRAND.name} password`,
    previewText: "Reset your password — link expires in 15 minutes.",
    inner,
  });
}

function passwordResetText({ name, resetUrl }) {
  return [
    name ? `Hi ${name},` : "Hi,",
    "",
    `We received a request to reset the password for your ${BRAND.name} account.`,
    "",
    "Reset your password:",
    resetUrl,
    "",
    "This link expires in 15 minutes and can only be used once.",
    "",
    "If you didn't request this, you can safely ignore this email.",
    "",
    `— The ${BRAND.name} team`,
  ].join("\n");
}

// ─── Order confirmation ─────────────────────────────────────────────────────

function orderItemsTableHtml({ items, currency }) {
  const rows = items
    .map((item) => {
      const lineTotal = Number(item.price) * Number(item.quantity);
      const imgUrl = item.image || "";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td valign="top" width="64" style="padding-right:12px;">
                  ${imgUrl
                    ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.name || "")}" width="64" height="64" style="display:block;border-radius:6px;border:1px solid ${BRAND.border};object-fit:cover;">`
                    : `<div style="width:64px;height:64px;background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;"></div>`}
                </td>
                <td valign="top" style="font-family:${BRAND.fontBody};font-size:14px;color:${BRAND.text};">
                  <div style="font-weight:600;color:${BRAND.text};">${escapeHtml(item.name || "Item")}</div>
                  <div style="color:${BRAND.muted};font-size:13px;margin-top:2px;">Qty ${Number(item.quantity)}</div>
                </td>
                <td valign="top" align="right" style="font-family:${BRAND.fontBody};font-size:14px;color:${BRAND.text};white-space:nowrap;">
                  ${formatMoney(lineTotal, currency)}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 16px;">${rows}</table>`;
}

function priceRowHtml({ label, value, currency, emphasized = false }) {
  const fontWeight = emphasized ? 700 : 400;
  const color = emphasized ? BRAND.text : BRAND.textBody;
  return `
    <tr>
      <td style="padding:4px 0;font-family:${BRAND.fontBody};font-size:14px;color:${color};font-weight:${fontWeight};">${escapeHtml(label)}</td>
      <td align="right" style="padding:4px 0;font-family:${BRAND.fontBody};font-size:14px;color:${color};font-weight:${fontWeight};white-space:nowrap;">${formatMoney(value, currency)}</td>
    </tr>`;
}

function orderConfirmationHtml({ name, order, currency, orderUrl }) {
  const s = order.shippingInfo || {};
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const subtotal = Number(order.itemPrice || 0);
  const shipping = Number(order.shippingPrice || 0);
  const tax = Number(order.taxPrice || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.totalPrice || 0);

  const inner = `
    <h1 style="margin:0 0 8px;font-family:${BRAND.fontHeading};font-size:26px;font-weight:600;color:${BRAND.text};line-height:1.2;letter-spacing:-0.01em;">Thanks for your order</h1>
    <p style="margin:0 0 24px;color:${BRAND.textBody};">Hi${name ? ` ${escapeHtml(name)}` : ""}, we've received your order and we're getting it ready. You'll get another email when it ships.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;padding:16px;background-color:${BRAND.bg};border-radius:6px;">
      <tr>
        <td style="font-family:${BRAND.fontBody};font-size:13px;color:${BRAND.muted};">Order number</td>
        <td align="right" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:${BRAND.text};">#${escapeHtml(String(order._id || ""))}</td>
      </tr>
      <tr>
        <td style="font-family:${BRAND.fontBody};font-size:13px;color:${BRAND.muted};padding-top:4px;">Placed on</td>
        <td align="right" style="font-family:${BRAND.fontBody};font-size:13px;color:${BRAND.text};padding-top:4px;">${escapeHtml(new Date(order.paidAt || order.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))}</td>
      </tr>
    </table>

    <h2 style="margin:24px 0 8px;font-family:${BRAND.fontHeading};font-size:18px;font-weight:600;color:${BRAND.text};">Items</h2>
    ${orderItemsTableHtml({ items, currency })}

    ${orderUrl ? primaryButton({ href: orderUrl, label: "View your order" }) : ""}

    <h2 style="margin:24px 0 8px;font-family:${BRAND.fontHeading};font-size:18px;font-weight:600;color:${BRAND.text};">Order summary</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;">
      ${priceRowHtml({ label: "Subtotal", value: subtotal, currency })}
      ${priceRowHtml({ label: "Shipping", value: shipping, currency })}
      ${priceRowHtml({ label: "Tax", value: tax, currency })}
      ${discount > 0 ? priceRowHtml({ label: "Discount", value: -discount, currency }) : ""}
      <tr><td colspan="2" style="padding:8px 0 0;border-top:1px solid ${BRAND.border};"></td></tr>
      ${priceRowHtml({ label: "Total", value: total, currency, emphasized: true })}
    </table>

    <h2 style="margin:24px 0 8px;font-family:${BRAND.fontHeading};font-size:18px;font-weight:600;color:${BRAND.text};">Shipping to</h2>
    <p style="margin:0 0 16px;font-family:${BRAND.fontBody};font-size:14px;line-height:1.6;color:${BRAND.textBody};">
      ${escapeHtml(s.address || "")}<br>
      ${escapeHtml(s.city || "")}, ${escapeHtml(s.state || "")} ${escapeHtml(String(s.zip || ""))}<br>
      ${escapeHtml(s.country || "")}
    </p>
  `;
  return shell({
    title: `Order #${order._id} confirmed`,
    previewText: `Order confirmed — total ${formatMoney(total, currency)}.`,
    inner,
  });
}

function orderConfirmationText({ name, order, currency, orderUrl }) {
  const s = order.shippingInfo || {};
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const lines = [
    name ? `Hi ${name},` : "Hi,",
    "",
    "Thanks for your order. We've received it and we're getting it ready.",
    "",
    `Order #${order._id}`,
    `Placed ${new Date(order.paidAt || order.createdAt || Date.now()).toLocaleString()}`,
    "",
    "Items:",
    ...items.map(
      (i) => `  - ${i.name} x${i.quantity} — ${formatMoney(Number(i.price) * Number(i.quantity), currency)}`
    ),
    "",
    orderUrl ? `View your order: ${orderUrl}` : "",
    "",
    "Summary:",
    `  Subtotal: ${formatMoney(order.itemPrice, currency)}`,
    `  Shipping: ${formatMoney(order.shippingPrice, currency)}`,
    `  Tax:      ${formatMoney(order.taxPrice, currency)}`,
    order.discount ? `  Discount: -${formatMoney(order.discount, currency)}` : "",
    `  Total:    ${formatMoney(order.totalPrice, currency)}`,
    "",
    "Shipping to:",
    `  ${s.address}`,
    `  ${s.city}, ${s.state} ${s.zip}`,
    `  ${s.country}`,
    "",
    `— The ${BRAND.name} team`,
  ].filter(Boolean);
  return lines.join("\n");
}

module.exports = {
  BRAND,
  escapeHtml,
  formatMoney,
  passwordResetHtml,
  passwordResetText,
  orderConfirmationHtml,
  orderConfirmationText,
};