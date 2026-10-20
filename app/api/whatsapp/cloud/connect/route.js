import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  bots,
  whatsappAccounts,
} from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import {
  encryptWhatsAppToken,
} from '@/lib/whatsapp/token-encryption';

export const runtime = 'nodejs';

const GRAPH_VERSION =
  process.env.META_GRAPH_API_VERSION || 'v26.0';

function errorResponse(message, status) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

export async function POST(request) {
  try {
    const auth = await getAuthContext(request);

    if (
      !auth?.userId ||
      !auth?.workspaceId ||
      auth.role === 'guest'
    ) {
      return errorResponse('Authentication required.', 401);
    }

    const body = await request.json();

    const botId = String(body.botId || '').trim();
    const code = String(body.code || '').trim();
    const wabaId = String(body.wabaId || '').trim();
    const phoneNumberId = String(
      body.phoneNumberId || ''
    ).trim();

    if (!botId || !code || !wabaId || !phoneNumberId) {
      return errorResponse(
        'botId, code, wabaId and phoneNumberId are required.',
        400
      );
    }

    const bot = await db
      .select()
      .from(bots)
      .where(
        and(
          eq(bots.id, botId),
          eq(bots.workspaceId, auth.workspaceId)
        )
      )
      .then((rows) => rows[0]);

    if (!bot) {
      return errorResponse(
        'Bot not found in your workspace.',
        404
      );
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return errorResponse(
        'Meta server configuration is incomplete.',
        500
      );
    }

    // Exchange the temporary Embedded Signup authorization code
    // on the server. Never expose the app secret to the browser.
    const exchangeUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`
    );

    exchangeUrl.searchParams.set('client_id', appId);
    exchangeUrl.searchParams.set('client_secret', appSecret);
    exchangeUrl.searchParams.set('code', code);

    const exchangeResponse = await fetch(exchangeUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    const exchangeData = await exchangeResponse.json();

    if (!exchangeResponse.ok || !exchangeData.access_token) {
      console.error(
        '[WhatsApp Embedded Signup] Token exchange failed:',
        exchangeData.error?.type || 'Meta API error',
        exchangeData.error?.code || ''
      );

      return errorResponse(
        'Meta could not exchange the signup code. Please restart signup.',
        400
      );
    }

    const accessToken = exchangeData.access_token;

    // Validate that the supplied phone number belongs to the
    // selected WhatsApp Business Account.
    const phoneUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}`
    );

    phoneUrl.searchParams.set(
      'fields',
      'id,display_phone_number,verified_name'
    );

    const phoneResponse = await fetch(phoneUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    const phoneData = await phoneResponse.json();

    if (
      !phoneResponse.ok ||
      phoneData.id !== phoneNumberId ||
      !phoneData.display_phone_number
    ) {
      console.error(
        '[WhatsApp Embedded Signup] Phone validation failed:',
        phoneData.error?.code || 'Validation error'
      );

      return errorResponse(
        'Meta could not verify the selected WhatsApp phone number. Check your Embedded Signup permissions and asset access.',
        400
      );
    }

    // Confirm the phone number is accessible through the selected WABA.
    const wabaUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/phone_numbers`
    );

    wabaUrl.searchParams.set('fields', 'id');

    const wabaResponse = await fetch(wabaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    const wabaData = await wabaResponse.json();

    if (
      !wabaResponse.ok ||
      !Array.isArray(wabaData.data) ||
      !wabaData.data.some(
        (phone) => phone.id === phoneNumberId
      )
    ) {
      return errorResponse(
        'The selected phone number could not be verified against the selected WhatsApp Business Account.',
        400
      );
    }

    const encryptedToken =
      encryptWhatsAppToken(accessToken);

    const existingAccount = await db
      .select()
      .from(whatsappAccounts)
      .where(
        eq(whatsappAccounts.phoneNumberId, phoneNumberId)
      )
      .then((rows) => rows[0]);

    if (
      existingAccount &&
      (
        existingAccount.workspaceId !== auth.workspaceId ||
        existingAccount.botId !== botId
      )
    ) {
      return errorResponse(
        'This WhatsApp number is already connected to another bot or workspace.',
        409
      );
    }

    const now = new Date();

    if (existingAccount) {
      await db
        .update(whatsappAccounts)
        .set({
          businessAccountId: wabaId,
          displayPhoneNumber: phoneData.display_phone_number,
          verifiedName: phoneData.verified_name || null,
          accessTokenEncrypted: encryptedToken,
          status: 'connected',
          updatedAt: now,
        })
        .where(eq(whatsappAccounts.id, existingAccount.id));
    } else {
      await db
        .insert(whatsappAccounts)
        .values({
          id: randomUUID(),
          workspaceId: auth.workspaceId,
          botId,
          phoneNumberId,
          businessAccountId: wabaId,
          displayPhoneNumber: phoneData.display_phone_number,
          verifiedName: phoneData.verified_name || null,
          accessTokenEncrypted: encryptedToken,
          status: 'connected',
          createdAt: now,
          updatedAt: now,
        });
    }

    await db
      .update(bots)
      .set({
        phoneNumberId,
        whatsappNumber: phoneData.display_phone_number,
        whatsappStatus: 'connected',
        updatedAt: now,
      })
      .where(
        and(
          eq(bots.id, botId),
          eq(bots.workspaceId, auth.workspaceId)
        )
      );

    return NextResponse.json({
      success: true,
      status: 'connected',
      phoneNumber: phoneData.display_phone_number,
      verifiedName: phoneData.verified_name || null,
    });
  } catch (error) {
    console.error(
      '[WhatsApp Embedded Signup] Connection failed:',
      error.message
    );

    return errorResponse(
      'Failed to connect WhatsApp. Check server configuration and logs.',
      500
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = await getAuthContext(request);

    if (
      !auth?.userId ||
      !auth?.workspaceId ||
      auth.role === 'guest'
    ) {
      return errorResponse('Authentication required.', 401);
    }

    const botId = request.nextUrl.searchParams.get('botId');

    if (!botId) {
      return errorResponse('botId is required.', 400);
    }

    const bot = await db
      .select()
      .from(bots)
      .where(
        and(
          eq(bots.id, botId),
          eq(bots.workspaceId, auth.workspaceId)
        )
      )
      .then((rows) => rows[0]);

    if (!bot) {
      return errorResponse('Bot not found.', 404);
    }

    await db
      .delete(whatsappAccounts)
      .where(
        and(
          eq(whatsappAccounts.botId, botId),
          eq(whatsappAccounts.workspaceId, auth.workspaceId)
        )
      );

    await db
      .update(bots)
      .set({
        phoneNumberId: null,
        whatsappNumber: null,
        whatsappStatus: 'disconnected',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bots.id, botId),
          eq(bots.workspaceId, auth.workspaceId)
        )
      );

    return NextResponse.json({
      success: true,
      status: 'disconnected',
    });
  } catch (error) {
    console.error(
      '[WhatsApp Cloud API] Disconnect failed:',
      error.message
    );

    return errorResponse('Failed to disconnect WhatsApp.', 500);
  }
}