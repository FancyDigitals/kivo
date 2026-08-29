import { logger } from '@/lib/utils/logger';

function toWhatsAppRecipient(phone) {
  // Meta requires country code + number, NO + or spaces
  return String(phone || '').replace(/\D/g, '');
}

export async function sendWhatsAppTextMessage({ to, text, phoneNumberId, accessToken }) {
  const token = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = toWhatsAppRecipient(to);
  const bodyText = (text || '').toString().trim();

  if (!token || !phoneId) {
    logger.error('WhatsApp credentials missing (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID)');
    return { success: false, error: 'Missing Meta credentials' };
  }

  if (!recipient || !bodyText) {
    logger.error('WhatsApp send skipped: empty recipient or text', { recipient, bodyText });
    return { success: false, error: 'Empty recipient or text' };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: { preview_url: false, body: bodyText.slice(0, 4096) },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      logger.error('Meta WhatsApp Graph API error', data);
      return { success: false, error: data };
    }

    logger.info(`WhatsApp reply delivered to ${recipient}`);
    return { success: true, data };
  } catch (err) {
    logger.error('Failed to dispatch WhatsApp message', err);
    return { success: false, error: err.message };
  }
}