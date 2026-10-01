import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  readBotStatus,
  requestBotConnect,
  ensureBotDir,
} from '@/lib/whatsapp/session-store';

export async function GET(request, { params }) {
  try {
    const resolved = await params;
    const botId = resolved?.botId;

    if (!botId) {
      return NextResponse.json(
        { success: false, error: 'Bot ID required' },
        { status: 400 }
      );
    }

    ensureBotDir(botId);
    requestBotConnect(botId);

    const current = readBotStatus(botId);
    const number = current.number
      ? String(current.number).startsWith('+')
        ? current.number
        : `+${current.number}`
      : null;

    return NextResponse.json({
      success: true,
      status: current.status || 'disconnected',
      qrDataUrl: current.qrDataUrl || null,
      whatsappNumber: number,
    });
  } catch (error) {
    console.error('[whatsapp/qr GET]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'QR status failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolved = await params;
    const botId = resolved?.botId;

    if (!botId) {
      return NextResponse.json(
        { success: false, error: 'Bot ID required' },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), 'sessions', `bot_${botId}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, 'logout.request'),
      String(Date.now()),
      'utf8'
    );

    return NextResponse.json({ success: true, status: 'disconnecting' });
  } catch (error) {
    console.error('[whatsapp/qr DELETE]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Disconnect failed' },
      { status: 500 }
    );
  }
}