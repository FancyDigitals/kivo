import fs from 'fs';
import path from 'path';

function botDir(botId) {
  return path.join(process.cwd(), 'sessions', `bot_${botId}`);
}

function statusFile(botId) {
  return path.join(botDir(botId), 'status.json');
}

function connectRequestFile(botId) {
  return path.join(botDir(botId), 'connect.request');
}

export function ensureBotDir(botId) {
  const dir = botDir(botId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeBotStatus(botId, payload) {
  ensureBotDir(botId);
  const data = {
    status: 'disconnected',
    qrDataUrl: null,
    number: null,
    ...payload,
    updatedAt: Date.now(),
  };
  fs.writeFileSync(statusFile(botId), JSON.stringify(data, null, 2), 'utf8');
}

export function readBotStatus(botId) {
  try {
    const p = statusFile(botId);
    if (!fs.existsSync(p)) {
      return { status: 'disconnected', qrDataUrl: null, number: null };
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { status: 'disconnected', qrDataUrl: null, number: null };
  }
}

export function clearBotStatus(botId) {
  try {
    const p = statusFile(botId);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
}

export function requestBotConnect(botId) {
  ensureBotDir(botId);
  fs.writeFileSync(connectRequestFile(botId), String(Date.now()), 'utf8');
}

export function consumeBotConnectRequest(botId) {
  const p = connectRequestFile(botId);
  if (!fs.existsSync(p)) return false;
  try {
    fs.unlinkSync(p);
    return true;
  } catch {
    return false;
  }
}