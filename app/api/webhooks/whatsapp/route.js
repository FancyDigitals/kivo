import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, conversations, messages, bots } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { generateAiResponse } from '@/lib/ai/gateway';
import { buildSystemPrompt } from '@/lib/ai/prompts/builder';
import { buildKnowledgeContext, buildProductContext } from '@/lib/knowledge/retrieval';
import { knowledgeStore, productsStore } from '@/lib/db/memoryStore';
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

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'kivo_whatsapp_verify_token_2025';

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
    const metaMetadata = value?.metadata; // Contains phone_number_id & display_phone_number

    if (!incomingMessage) {
      // Event status update (read/delivered receipt)
      return NextResponse.json({ status: 'event_received' }, { status: 200 });
    }

    const messageId = incomingMessage.id;
    if (processedMessageIds.has(messageId)) {
      return NextResponse.json({ status: 'already_processed' }, { status: 200 });
    }
    processedMessageIds.add(messageId);

    const fromPhone = sanitizePhone(incomingMessage.from);
    const customerName = contactInfo?.profile?.name || `Customer ${fromPhone.slice(-4)}`;
    const userMessageText = incomingMessage.text?.body || '';
    const incomingPhoneId = metaMetadata?.phone_number_id;
    const displayPhoneNumber = metaMetadata?.display_phone_number;

    logger.info(`Live WhatsApp Message from ${fromPhone} to Meta Phone ID ${incomingPhoneId}: "${userMessageText}"`);

    // A. Dynamic Bot Lookup (Match by phone_number_id or whatsappNumber, else fallback to latest bot)
    let activeBot = null;

    if (incomingPhoneId) {
      activeBot = await db.select().from(bots).where(eq(bots.phoneNumberId, incomingPhoneId)).then((r) => r[0]);
    }

    if (!activeBot && displayPhoneNumber) {
      activeBot = await db.select().from(bots).where(eq(bots.whatsappNumber, displayPhoneNumber)).then((r) => r[0]);
    }

    if (!activeBot) {
      // Fallback: pick the first available bot in DB
      activeBot = await db.select().from(bots).then((r) => r[0]);
    }

    if (!activeBot) {
      logger.warn('No active bot configured in database to handle incoming WhatsApp message');
      return NextResponse.json({ status: 'no_active_bot' }, { status: 200 });
    }

    const workspaceId = activeBot.workspaceId;

    // B. Upsert Customer Profile
    let customer = await db.select().from(customers).where(and(eq(customers.workspaceId, workspaceId), eq(customers.phoneNumber, fromPhone))).then((r) => r[0]);

    if (!customer) {
      const custId = generateId('cust');
      customer = {
        id: custId,
        workspaceId,
        phoneNumber: fromPhone,
        name: customerName,
        tags: ['WhatsApp Incoming'],
      };
      await db.insert(customers).values(customer);
    }

    // C. Upsert Conversation Thread
    let conv = await db.select().from(conversations).where(and(eq(conversations.workspaceId, workspaceId), eq(conversations.customerId, customer.id))).then((r) => r[0]);

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
      await db.insert(conversations).values(conv);
    }

    // D. Save Customer Message
    await db.insert(messages).values({
      id: generateId('msg'),
      workspaceId,
      conversationId: conv.id,
      senderType: 'customer',
      senderId: customer.id,
      content: userMessageText,
      externalMessageId: messageId,
    });

    // E. Human Handoff Check
    const handoffKeywords = activeBot.handoffKeywords || ['human', 'agent', 'support', 'manager'];
    const needsHandoff = handoffKeywords.some((kw) => userMessageText.toLowerCase().includes(kw));

    if (needsHandoff || conv.mode === 'human') {
      logger.info(`Human handoff triggered for ${fromPhone}`);
      
      await db.update(conversations).set({ mode: 'human', lastMessageSnippet: userMessageText, updatedAt: new Date() }).where(eq(conversations.id, conv.id));

      await sendWhatsAppTextMessage({
        to: fromPhone,
        text: `I've connected you with a human representative from *${activeBot.businessName}*. A team member will reply shortly!`,
        phoneNumberId: activeBot.phoneNumberId || incomingPhoneId,
      });

      return NextResponse.json({ status: 'human_handoff_active' }, { status: 200 });
    }

    // F. Execute AI Gateway Response
    const knowledgeItems = Array.from(knowledgeStore.values());
    const productItems = Array.from(productsStore.values());

    const knowledgeText = buildKnowledgeContext(knowledgeItems);
    const productText = buildProductContext(productItems);

    const systemPrompt = buildSystemPrompt({
      botName: activeBot.name,
      businessName: activeBot.businessName,
      industry: activeBot.industry,
      personality: activeBot.personality,
      language: activeBot.language,
      objectives: activeBot.objectives || [],
      rules: activeBot.rules || [],
      restrictions: activeBot.restrictions || [],
      knowledgeContext: knowledgeText,
      productContext: productText,
    });

    const aiResult = await generateAiResponse({
      messages: [{ role: 'user', content: userMessageText }],
      systemPrompt,
      primaryProvider: activeBot.primaryProvider || 'groq',
      primaryModel: activeBot.primaryModel || 'llama-3.1-8b-instant',
      temperature: Number(activeBot.temperature || 0.3),
      workspaceId,
      botId: activeBot.id,
    });

    // G. Save AI Message & Reply via Meta Cloud API
    await db.insert(messages).values({
      id: generateId('msg'),
      workspaceId,
      conversationId: conv.id,
      senderType: 'bot',
      senderId: activeBot.id,
      content: aiResult.text,
    });

    await db.update(conversations).set({ lastMessageSnippet: aiResult.text, updatedAt: new Date() }).where(eq(conversations.id, conv.id));

    await sendWhatsAppTextMessage({
      to: fromPhone,
      text: aiResult.text,
      phoneNumberId: activeBot.phoneNumberId || incomingPhoneId,
    });

    return NextResponse.json({ success: true, status: 'processed' }, { status: 200 });
  } catch (error) {
    logger.error('Error processing WhatsApp webhook', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}