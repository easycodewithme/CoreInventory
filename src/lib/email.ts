import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LowStockItem {
  name: string;
  sku: string;
  on_hand: number;
  reorder_level: number;
}

export async function sendLowStockAlert(items: LowStockItem[], recipientEmail: string) {
  if (!items.length) return;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a32;">${item.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a32; font-family: monospace; color: #71717a;">${item.sku}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a32; text-align: right; color: #ef4444; font-weight: 600;">${item.on_hand}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #2a2a32; text-align: right; color: #71717a;">${item.reorder_level}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0c0e; color: #e4e4e7; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #141417; border: 1px solid #2a2a32; border-radius: 12px; overflow: hidden;">
        <div style="padding: 24px; border-bottom: 1px solid #2a2a32;">
          <h1 style="margin: 0; font-size: 20px; color: #e4e4e7;">
            ⚠️ Low Stock Alert
          </h1>
          <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">
            ${items.length} product${items.length > 1 ? 's have' : ' has'} fallen below the reorder level
          </p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="color: #71717a; text-align: left;">
                <th style="padding: 8px 12px; border-bottom: 1px solid #2a2a32;">Product</th>
                <th style="padding: 8px 12px; border-bottom: 1px solid #2a2a32;">SKU</th>
                <th style="padding: 8px 12px; border-bottom: 1px solid #2a2a32; text-align: right;">On Hand</th>
                <th style="padding: 8px 12px; border-bottom: 1px solid #2a2a32; text-align: right;">Reorder Level</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>
        <div style="padding: 16px 24px; background: #1e1e24; border-top: 1px solid #2a2a32; text-align: center;">
          <p style="margin: 0; color: #71717a; font-size: 12px;">
            CoreInventory — Inventory Management System
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'CoreInventory <noreply@yourdomain.com>',
      to: recipientEmail,
      subject: `⚠️ Low Stock Alert: ${items.length} product${items.length > 1 ? 's' : ''} below reorder level`,
      html,
    });
  } catch (error) {
    console.error('Failed to send low stock alert email:', error);
  }
}
