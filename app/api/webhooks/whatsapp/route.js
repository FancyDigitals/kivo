import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import {
  customers,
  conversations,
  messages,
  bots,
  whatsappAccounts,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateAiResponse } from '@/lib/ai/gateway';
import { buildSystemPrompt } from '@/lib/ai/prompts/builder';
import {
  buildKnowledgeContext,
  buildProductContext,
} from '@/lib/knowledge/retrieval';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp/messages';
import { decryptWhatsAppToken } from '@/lib/whatsapp/token-encryption';
import { generateId, sanitizePhone } from '@/lib/utils/helpers';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';

const processedMessageIds = new Set();
const MAX_PROCESSED_IDS = 5000;

function verifyWebhookToken(received, expected) {
  if (!received || !expected) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === 'subscribe' &&
    verifyWebhookToken(token, expected) &&
    challenge
  ) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: 'Webhook verification failed' },
    { status: 403 }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        for (const incomingMessage of value.messages || []) {
          const messageId = incomingMessage.id;

          if (!messageId || processedMessageIds.has(messageId)) {
            continue;
          }

          processedMessageIds.add(messageId);

          if (processedMessageIds.size > MAX_PROCESSED_IDS) {
            processedMessageIds.clear();
          }

          try {
            await processIncomingMessage(value, incomingMessage);
          } catch (error) {
            logger.error(
              'WhatsApp message processing failed',
              error.message
            );
          }
        }
      }
    }

    return NextResponse.json({ status: 'received' });
  } catch (error) {
    logger.error('WhatsApp webhook request failed', error.message);

    // Return 200 to avoid repeated delivery of malformed payloads.
    return NextResponse.json({ status: 'received' });
  }
}

async function processIncomingMessage(value, incomingMessage) {
  const phoneNumberId = value.metadata?.phone_number_id;

  if (!phoneNumberId) {
    logger.warn('WhatsApp webhook missing phone_number_id');
    return;
  }

  // Exact account match only. Never choose another customer's bot.
  const account = await db
    .select()
    .from(whatsappAccounts)
    .where(
      and(
        eq(whatsappAccounts.phoneNumberId, phoneNumberId),
        eq(whatsappAccounts.status, 'connected')
      )
    )
    .then((rows) => rows[0]);

  if (!account) {
    logger.warn(
      `Ignoring WhatsApp message for unconnected phone ID ${phoneNumberId}`
    );
    return;
  }

  const bot = await db
    .select()
    .from(bots)
    .where(
      and(
        eq(bots.id, account.botId),
        eq(bots.workspaceId, account.workspaceId)
      )
    )
    .then((rows) => rows[0]);

  if (!bot) {
    logger.error('Connected WhatsApp account has no matching workspace bot');
    return;
  }

  let accessToken;

  try {
    accessToken = decryptWhatsAppToken(account.accessTokenEncrypted);
  } catch (error) {
    logger.error('Could not decrypt WhatsApp account token');
    return;
  }

  const fromPhone = sanitizePhone(incomingMessage.from);

  if (!fromPhone) return;

  const contact = (value.contacts || []).find(
    (item) => item.wa_id === incomingMessage.from
  );

  const customerName =
    contact?.profile?.name || `Customer ${fromPhone.slice(-4)}`;

  let userMessageText = '';

  if (incomingMessage.type === 'text') {
    userMessageText = incomingMessage.text?.body || '';
  } else if (incomingMessage.type === 'button') {
    userMessageText = incomingMessage.button?.text || '';
  } else if (incomingMessage.type === 'interactive') {
    userMessageText =
      incomingMessage.interactive?.button_reply?.title ||
      incomingMessage.interactive?.list_reply?.title ||
      '';
  }

  if (!userMessageText.trim()) {
    logger.info(
      `Ignoring unsupported WhatsApp message type: ${incomingMessage.type}`
    );
    return;
  }

  const workspaceId = account.workspaceId;

  // Find or create customer within this workspace.
  let customer = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.workspaceId, workspaceId),
        eq(customers.phoneNumber, fromPhone)
      )
    )
    .then((rows) => rows[0]);

  if (!customer) {
    const newCustomer = {
      id: generateId('cust'),
      workspaceId,
      phoneNumber: fromPhone,
      name: customerName,
      tags: ['WhatsApp Incoming'],
    };

    await db.insert(customers).values(newCustomer);
    customer = newCustomer;
  }

  // Find or create this customer's conversation for this bot.
  let conversation = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.workspaceId, workspaceId),
        eq(conversations.customerId, customer.id),
        eq(conversations.botId, bot.id),
        eq(conversations.channel, 'whatsapp')
      )
    )
    .then((rows) => rows[0]);

  if (!conversation) {
    const newConversation = {
      id: generateId('conv'),
      workspaceId,
      botId: bot.id,
      customerId: customer.id,
      channel: 'whatsapp',
      mode: 'ai',
      status: 'open',
      lastMessageSnippet: userMessageText.slice(0, 500),
    };

    await db.insert(conversations).values(newConversation);
    conversation = newConversation;
  }

  await db.insert(messages).values({
    id: generateId('msg'),
    workspaceId,
    conversationId: conversation.id,
    senderType: 'customer',
    senderId: customer.id,
    content: userMessageText,
    externalMessageId: incomingMessage.id,
  });

  const handoffKeywords = Array.isArray(bot.handoffKeywords)
    ? bot.handoffKeywords
    : ['human', 'agent', 'support', 'manager'];

  const needsHandoff = handoffKeywords.some((keyword) =>
    userMessageText.toLowerCase().includes(String(keyword).toLowerCase())
  );

  if (needsHandoff || conversation.mode === 'human') {
    await db
      .update(conversations)
      .set({
        mode: 'human',
        lastMessageSnippet: userMessageText.slice(0, 500),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversation.id));

    if (needsHandoff && conversation.mode !== 'human') {
      await sendWhatsAppTextMessage({
        to: fromPhone,
        text: `I've connected you with a human representative from ${bot.businessName}. A team member will reply shortly.`,
        phoneNumberId: account.phoneNumberId,
        accessToken,
      });
    }

    return;
  }

  const systemPrompt = buildSystemPrompt({
    botName: bot.name,
    businessName: bot.businessName,
    industry: bot.industry,
    personality: bot.personality || 'professional',
    language: bot.language || 'en',
    objectives: bot.objectives || [],
    rules: bot.rules || [],
    restrictions: bot.restrictions || [],
    knowledgeContext: buildKnowledgeContext([]),
    productContext: buildProductContext([]),
  });

  let replyText =
    bot.fallbackMessage ||
    `Hello! Thank you for contacting ${bot.businessName}. How can I help?`;

  try {
    const result = await generateAiResponse({
      messages: [
        {
          role: 'user',
          content: userMessageText,
        },
      ],
      systemPrompt,
      primaryProvider: bot.primaryProvider || 'groq',
      primaryModel: bot.primaryModel || 'llama-3.3-70b-versatile',
      fallbackProvider: bot.fallbackProvider || 'gemini',
      fallbackModel: bot.fallbackModel || 'gemini-2.5-flash',
      temperature: Number(bot.temperature || 0.3),
      maxTokens: 300,
      workspaceId,
      botId: bot.id,
    });

    if (result?.text) {
      replyText = result.text;
    }
  } catch (error) {
    logger.error('WhatsApp AI response failed', error.message);
  }

  await sendWhatsAppTextMessage({
    to: fromPhone,
    text: replyText,
    phoneNumberId: account.phoneNumberId,
    accessToken,
  });

  await db.insert(messages).values({
    id: generateId('msg'),
    workspaceId,
    conversationId: conversation.id,
    senderType: 'bot',
    senderId: bot.id,
    content: replyText,
  });

  await db
    .update(conversations)
    .set({
      lastMessageSnippet: replyText.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversation.id));

  logger.info(
    `WhatsApp reply processed for bot ${bot.id} in workspace ${workspaceId}`
  );
}
