import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

function getEncryptionKey() {
  const value = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY;

  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error(
      'WHATSAPP_TOKEN_ENCRYPTION_KEY must be a 64-character hexadecimal key.'
    );
  }

  return Buffer.from(value, 'hex');
}

export function encryptWhatsAppToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('A valid WhatsApp access token is required.');
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    'v1',
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

export function decryptWhatsAppToken(encryptedValue) {
  if (typeof encryptedValue !== 'string') {
    throw new Error('Encrypted WhatsApp token is required.');
  }

  const [version, ivHex, tagHex, dataHex] =
    encryptedValue.split(':');

  if (
    version !== 'v1' ||
    !ivHex ||
    !tagHex ||
    !dataHex
  ) {
    throw new Error('Invalid encrypted WhatsApp token format.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}