import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = '') {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid.replace(/-/g, '')}` : uuid;
}

export function formatCurrency(amount, currency = 'NGN') {
  const num = Number(amount) || 0;
  if (currency === 'NGN') {
    return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num);
}

export function sanitizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '').trim();
}

export function truncate(text, length = 100) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

/**
 * Post-processes AI responses to enforce WhatsApp human typing standards:
 * - Strips em-dashes (—) and en-dashes (–)
 * - Removes leading list hyphens (- )
 * - Normalizes **double asterisks** into *single asterisks* for WhatsApp bold
 */
export function sanitizeWhatsAppText(text) {
  if (!text) return '';

  let cleaned = text;

  // 1. Replace em-dashes and en-dashes
  cleaned = cleaned.replace(/[\u2014\u2013]/g, ', ');

  // 2. Remove list bullet hyphens
  cleaned = cleaned.replace(/^[ \t]*[-–—][ \t]*/gm, '');

  // 3. Normalize double asterisks to single asterisks
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '*$1*');

  return cleaned.trim();
}