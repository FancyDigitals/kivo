import { logger } from '@/lib/utils/logger';

/**
 * Sends a text message back to WhatsApp via official Meta Cloud API (v21.0)
 */
export async function sendWhatsAppTextMessage({ to, text, phoneNumberId, accessToken }) {
  const token = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    logger.error('WhatsApp API credentials missing. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env.local');
    return { success: false, error: 'Missing Meta credentials' };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      logger.error('Meta WhatsApp Graph API error:', data);
      return { success: false, error: data };
    }

    logger.info(`WhatsApp reply successfully delivered to ${to}`);
    return { success: true, data };
  } catch (err) {
    logger.error('Failed to dispatch WhatsApp message via Meta API', err);
    return { success: false, error: err.message };
  }
}