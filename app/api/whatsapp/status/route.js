import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

import {
  readBotStatus,
  requestBotConnect,
  ensureBotDir,
} from '@/lib/whatsapp/session-store';

/**
 * GET
 *
 * READ ONLY.
 *
 * This endpoint must NEVER start or restart a WhatsApp socket.
 * The frontend can safely poll this endpoint.
 */
export async function GET(request) {
  try {
    const botId = request.nextUrl.searchParams.get('botId');

    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: 'botId required',
        },
        { status: 400 }
      );
    }

    ensureBotDir(botId);

    const current = readBotStatus(botId);

    const rawNumber = current?.number;

    const whatsappNumber = rawNumber
      ? String(rawNumber).startsWith('+')
        ? String(rawNumber)
        : `+${rawNumber}`
      : null;

    return NextResponse.json({
      success: true,
      status: current?.status || 'disconnected',
      qrDataUrl: current?.qrDataUrl || null,
      whatsappNumber,
    });
  } catch (error) {
    console.error('[whatsapp/status GET]', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to read WhatsApp status',
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Explicitly request a WhatsApp connection.
 *
 * The engine will consume this request and create the socket.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const botId = body?.botId;

    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: 'botId required',
        },
        { status: 400 }
      );
    }

    ensureBotDir(botId);

    const current = readBotStatus(botId);

    /*
     * Never create another connection request when one is
     * already connected or currently scanning.
     */
    if (
      current?.status === 'connected' ||
      current?.status === 'scanning'
    ) {
      return NextResponse.json({
        success: true,
        status: current.status,
        alreadyActive: true,
      });
    }

    requestBotConnect(botId);

    return NextResponse.json({
      success: true,
      status: 'connecting',
      requested: true,
    });
  } catch (error) {
    console.error('[whatsapp/status POST]', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to request WhatsApp connection',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 *
 * Request a clean WhatsApp logout.
 */
export async function DELETE(request) {
  try {
    const botId = request.nextUrl.searchParams.get('botId');

    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: 'botId required',
        },
        { status: 400 }
      );
    }

    const dir = path.join(
      process.cwd(),
      'sessions',
      `bot_${botId}`
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const logoutFile = path.join(dir, 'logout.request');

    fs.writeFileSync(
      logoutFile,
      String(Date.now()),
      'utf8'
    );

    return NextResponse.json({
      success: true,
      status: 'disconnecting',
    });
  } catch (error) {
    console.error('[whatsapp/status DELETE]', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to disconnect WhatsApp',
      },
      { status: 500 }
    );
  }
}