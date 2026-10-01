import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, conversations, messages, bots, workspaces, whatsappAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateAiResponse } from '@/lib/ai/gateway';
import { buildSystemPrompt } from '@/lib/ai/prompts/builder';
import { buildKnowledgeContext, buildProductContext } from '@/lib/knowledge/retrieval';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp/messages';
import { generateId, sanitizePhone } from '@/lib/utils/helpers';
import { logger } from '@/lib/utils/logger';

const processedMessageIds = new Set();

// 1. META WEBHOOK VERIFICATION (GET)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'kivo_webhook_verify_token_2025';

  if (mode === 'subscribe' && token === expectedToken) {
    logger.info('Meta WhatsApp Webhook successfully verified');
    return new Response(challenge, { status: 200 });
  }

  logger.warn('WhatsApp Webhook verification failed due to invalid verify token');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// 2. LIVE INCOMING MESSAGE PROCESSOR (POST)
export async function POST(request) {
  try {
    const body = await request.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const incomingMessage = value?.messages?.[0];
    const contactInfo = value?.contacts?.[0];
    const metaMetadata = value?.metadata;

    if (!incomingMessage) {
      return NextResponse.json({ status: 'event_received' }, { status: 200 });
    }

    const messageId = incomingMessage.id;
    if (processedMessageIds.has(messageId)) {
      return NextResponse.json({ status: 'already_processed' }, { status: 200 });
    }
    processedMessageIds.add(messageId);

    if (processedMessageIds.size > 1000) {
      processedMessageIds.clear();
    }

    const fromPhone = sanitizePhone(incomingMessage.from);
    const customerName = contactInfo?.profile?.name || `Customer ${fromPhone.slice(-4)}`;
    const userMessageText = incomingMessage.text?.body || '';
    const incomingPhoneId = metaMetadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;

    logger.info(`Live WhatsApp Message from ${fromPhone} to Phone ID ${incomingPhoneId}: "${userMessageText}"`);

    // A. Dynamic Tenant & Bot Lookup
    let activeBot = null;
    let tenantAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    try {
      if (db) {
        // First, check connected WhatsApp accounts table for exact match
        if (incomingPhoneId) {
          const account = await db.select().from(whatsappAccounts).where(eq(whatsappAccounts.phoneNumberId, incomingPhoneId)).then((r) => r[0]);
          if (account) {
            tenantAccessToken = account.accessToken || tenantAccessToken;
            activeBot = await db.select().from(bots).where(eq(bots.id, account.botId)).then((r) => r[0]);
          }
        }

        // Fallback: match bot by phoneNumberId directly
        if (!activeBot && incomingPhoneId) {
          activeBot = await db.select().from(bots).where(eq(bots.phoneNumberId, incomingPhoneId)).then((r) => r[0]);
          if (activeBot?.accessToken) {
            tenantAccessToken = activeBot.accessToken;
          }
        }

        // Fallback: pick default first bot in DB
        if (!activeBot) {
          activeBot = await db.select().from(bots).then((r) => r[0]);
        }
      }
    } catch (dbErr) {
      logger.warn('Database query for active bot failed, using fallback:', dbErr.message);
    }

    // FALLBACK BOT: Guarantees auto-reply works during initial testing
    if (!activeBot) {
      activeBot = {
        id: 'bot_demo_1',
        workspaceId: 'ws_fancy_1',
        name: 'Kivo Assistant',
        businessName: 'Kivo AI',
        industry: 'Customer Support',
        personality: 'professional',
        language: 'en',
        phoneNumberId: incomingPhoneId,
        handoffKeywords: ['human', 'agent', 'support', 'manager', 'speak to someone'],
      };
    }

    const workspaceId = activeBot.workspaceId || 'ws_fancy_1';

    // B. Upsert Customer Profile
    let customer = null;
    try {
      if (db) {
        customer = await db.select().from(customers).where(and(eq(customers.workspaceId, workspaceId), eq(customers.phoneNumber, fromPhone))).then((r) => r[0]);

        if (!customer) {
          const custId = generateId('cust');
          customer = {
            id: custId,
            workspaceId,
            phoneNumber: fromPhone,
            name: customerName,
            tags: ['WhatsApp Incoming'],
          };
          await db.insert(customers).values(customer).catch(() => {});
        }
      }
    } catch (custErr) {
      logger.warn('Customer upsert skipped:', custErr.message);
    }

    // C. Upsert Conversation Thread
    let conv = null;
    try {
      if (db && customer) {
        conv = await db.select().from(conversations).where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.customerId, customer.id))).then((r) => r[0]);

        if (!conv) {
          const convId = generateId('conv');
          conv = {
            id: convId,
            workspaceId,
            botId: activeBot.id,
            customerId: customer.id,
            channel: 'whatsapp',
            mode: 'ai',
            status: 'open',
            lastMessageSnippet: userMessageText,
          };
          await db.insert(conversations).values(conv).catch(() => {});
        }
      }
    } catch (convErr) {
      logger.warn('Conversation upsert skipped:', convErr.message);
    }

    // D. Save Customer Message to Database
    try {
      if (db && conv) {
        await db.insert(messages).values({
          id: generateId('msg'),
          workspaceId,
          conversationId: conv.id,
          senderType: 'customer',
          senderId: customer?.id || 'cust_unknown',
          content: userMessageText,
          externalMessageId: messageId,
        }).catch(() => {});
      }
    } catch (msgErr) {
      // Non-blocking
    }

    // E. Human Handoff Check
    const handoffKeywords = activeBot.handoffKeywords || ['human', 'agent', 'support', 'manager', 'speak to someone'];
    const needsHandoff = handoffKeywords.some((kw) => userMessageText.toLowerCase().includes(kw));

    if (needsHandoff || conv?.mode === 'human') {
      logger.info(`Human handoff triggered for ${fromPhone}`);

      if (db && conv) {
        await db.update(conversations)
          .set({ mode: 'human', lastMessageSnippet: userMessageText, updatedAt: new Date() })
          .where(eq(conversations.id, conv.id))
          .catch(() => {});
      }

      const handoffReply = `I've connected you with a human representative from *${activeBot.businessName}*. A team member will reply shortly!`;

      const sendHandoffResult = await sendWhatsAppTextMessage({
        to: fromPhone,
        text: handoffReply,
        phoneNumberId: incomingPhoneId,
        accessToken: tenantAccessToken, // Use Tenant Token!
      });

      return NextResponse.json({ status: 'human_handoff_active', sendHandoffResult }, { status: 200 });
    }

    // F. Build System Prompt
    const systemPrompt = buildSystemPrompt({
      botName: activeBot.name,
      businessName: activeBot.businessName,
      industry: activeBot.industry,
      personality: activeBot.personality || 'professional',
      language: activeBot.language || 'en',
      objectives: activeBot.objectives || [],
      rules: activeBot.rules || [],
      restrictions: activeBot.restrictions || [],
      knowledgeContext: buildKnowledgeContext([]),
      productContext: buildProductContext([]),
    });

    // G. Generate AI Response via AI Gateway
    let replyText = "Hello! Thank you for contacting us on WhatsApp. How can I assist you today?";
    let aiResult = null;

    try {
      aiResult = await generateAiResponse({
        messages: [{ role: 'user', content: userMessageText || 'Hello' }],
        systemPrompt,
        primaryProvider: activeBot.primaryProvider || 'groq',
        primaryModel: activeBot.primaryModel || 'llama-3.3-70b-versatile',
        fallbackProvider: 'gemini',
        temperature: Number(activeBot.temperature || 0.3),
        maxTokens: 300,
        workspaceId,
        botId: activeBot.id,
      });

      if (aiResult?.text) {
        replyText = aiResult.text;
      }
    } catch (aiErr) {
      logger.error('AI Gateway error on WhatsApp webhook:', aiErr.message);
    }

    // H. Save Bot Reply to DB
    try {
      if (db && conv) {
        await db.insert(messages).values({
          id: generateId('msg'),
          workspaceId,
          conversationId: conv.id,
          senderType: 'bot',
          senderId: activeBot.id,
          content: replyText,
        }).catch(() => {});

        await db.update(conversations)
          .set({ lastMessageSnippet: replyText, updatedAt: new Date() })
          .where(eq(conversations.id, conv.id))
          .catch(() => {});
      }
    } catch (saveErr) {
      // Non-blocking
    }

    // I. Send Response via Meta WhatsApp Graph API using Tenant Token
    const sendResult = await sendWhatsAppTextMessage({
      to: fromPhone,
      text: replyText,
      phoneNumberId: incomingPhoneId,
      accessToken: tenantAccessToken, // <--- Correctly uses Tenant's Access Token!
    });

    logger.info(`WhatsApp Auto-Reply delivered to ${fromPhone}:`, sendResult);

    return NextResponse.json({ success: true, status: 'processed', sendResult, provider: aiResult?.provider }, { status: 200 });

  } catch (error) {
    logger.error('Fatal Error processing WhatsApp webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}