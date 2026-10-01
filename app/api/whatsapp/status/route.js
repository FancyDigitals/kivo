import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  readBotStatus,
  requestBotConnect,
  ensureBotDir,
} from '@/lib/whatsapp/session-store';

export async function GET(request) {
  try {
    const botId = request.nextUrl.searchParams.get('botId');
    if (!botId) {
      return NextResponse.json({ success: false, error: 'botId required' }, { status: 400 });
    }

    ensureBotDir(botId);

    const current = readBotStatus(botId);
    // Only request connect if not already connected
    if (current.status !== 'connected') {
      requestBotConnect(botId);
    }

    const raw = current.number;
    const whatsappNumber = raw
      ? String(raw).startsWith('+')
        ? String(raw)
        : `+${raw}`
      : null;

    return NextResponse.json({
      success: true,
      status: current.status || 'disconnected',
      qrDataUrl: current.qrDataUrl || null,
      whatsappNumber,
    });
  } catch (error) {
    console.error('[whatsapp/status]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const botId = request.nextUrl.searchParams.get('botId');
    if (!botId) {
      return NextResponse.json({ success: false, error: 'botId required' }, { status: 400 });
    }
    const dir = path.join(process.cwd(), 'sessions', `bot_${botId}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'logout.request'), String(Date.now()), 'utf8');
    return NextResponse.json({ success: true, status: 'disconnecting' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}