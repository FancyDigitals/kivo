import { logger } from '../utils/logger.js';

/**
 * Sends a message to a customer via the Official Meta WhatsApp Business Cloud API.
 */
export async function sendWhatsAppTextMessage({
  to,
  text,
  phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken = process.env.WHATSAPP_ACCESS_TOKEN,
  apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0',
}) {
  if (!phoneNumberId || !accessToken) {
    logger.warn('WhatsApp Cloud API credentials not configured in environment. Message simulation mode active.', { to, text });
    return { success: true, simulated: true };
  }

  const cleanPhone = to.replace(/[^0-9]/g, '');
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { body: text },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Meta WhatsApp API returned an error:', data);
      throw new Error(`WhatsApp API Error: ${data.error?.message || response.statusText}`);
    }

    const wamid = data.messages?.[0]?.id;
    logger.info(`Successfully sent WhatsApp message to ${cleanPhone} (wamid: ${wamid})`);

    return {
      success: true,
      wamid,
      data,
    };
  } catch (error) {
    logger.error('Error dispatching WhatsApp message', error);
    throw error;
  }
}