import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { bots, whatsappAccounts } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/getAuthContext';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);

    if (
      !auth?.userId ||
      !auth?.workspaceId ||
      auth.role === 'guest'
    ) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const botId = request.nextUrl.searchParams.get('botId');

    if (!botId) {
      return NextResponse.json(
        { success: false, error: 'botId is required.' },
        { status: 400 }
      );
    }

    const bot = await db
      .select({
        id: bots.id,
        whatsappStatus: bots.whatsappStatus,
        whatsappNumber: bots.whatsappNumber,
        phoneNumberId: bots.phoneNumberId,
      })
      .from(bots)
      .where(
        and(
          eq(bots.id, botId),
          eq(bots.workspaceId, auth.workspaceId)
        )
      )
      .then((rows) => rows[0]);

    if (!bot) {
      return NextResponse.json(
        { success: false, error: 'Bot not found.' },
        { status: 404 }
      );
    }

    const account = await db
      .select({
        phoneNumberId: whatsappAccounts.phoneNumberId,
        displayPhoneNumber: whatsappAccounts.displayPhoneNumber,
        verifiedName: whatsappAccounts.verifiedName,
        status: whatsappAccounts.status,
      })
      .from(whatsappAccounts)
      .where(
        and(
          eq(whatsappAccounts.botId, botId),
          eq(whatsappAccounts.workspaceId, auth.workspaceId)
        )
      )
      .then((rows) => rows[0]);

    const connected = account?.status === 'connected';

    return NextResponse.json({
      success: true,
      status: connected
        ? 'connected'
        : bot.whatsappStatus || 'disconnected',
      connected,
      phoneNumber: connected
        ? account.displayPhoneNumber
        : bot.whatsappNumber || null,
      phoneNumberId: connected
        ? account.phoneNumberId
        : bot.phoneNumberId || null,
      verifiedName: account?.verifiedName || null,
      provider: connected ? 'meta_cloud_api' : null,
    });
  } catch (error) {
    console.error('[WhatsApp Cloud Status]', error.message);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch WhatsApp status.' },
      { status: 500 }
    );
  }
}