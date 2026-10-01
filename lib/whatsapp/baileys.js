import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import { eq, and } from 'drizzle-orm';

import {
  writeBotStatus,
  readBotStatus,
  clearBotStatus,
  ensureBotDir,
} from './session-store.js';
import { db } from '../db/index.js';
import {
  bots,
  customers,
  conversations,
  messages,
  knowledgeSources,
  products,
} from '../db/schema.js';
import { generateAiResponse } from '../ai/gateway.js';
import { buildSystemPrompt } from '../ai/prompts/builder.js';
import {
  buildKnowledgeContext,
  buildProductContext,
} from '../knowledge/retrieval.js';
import { generateId, sanitizePhone } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const activeSockets = new Map();
const qrCodeCache = new Map();
const initializing = new Set();
const processedMsgIds = new Set();
const reconnectTimers = new Map();

function sessionsDirFor(botId) {
  return path.join(process.cwd(), 'sessions', `bot_${botId}`);
}

function extractText(msg) {
  const m = msg?.message;
  if (!m) return '';
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return m.imageMessage.caption;
  if (m.videoMessage?.caption) return m.videoMessage.caption;
  if (m.buttonsResponseMessage?.selectedDisplayText) {
    return m.buttonsResponseMessage.selectedDisplayText;
  }
  if (m.listResponseMessage?.title) return m.listResponseMessage.title;
  if (m.templateButtonReplyMessage?.selectedDisplayText) {
    return m.templateButtonReplyMessage.selectedDisplayText;
  }
  return '';
}

function clearReconnectTimer(botId) {
  const t = reconnectTimers.get(botId);
  if (t) clearTimeout(t);
  reconnectTimers.delete(botId);
}

/**
 * ONLY call from bot.js — never from Next.js.
 */
export async function initBotSocket(botId) {
  if (!botId) throw new Error('botId required');

  // Already connected — do nothing (stops resync loops)
  if (activeSockets.has(botId)) {
    const sock = activeSockets.get(botId);
    if (sock?.user) {
      const number = sanitizePhone(String(sock.user.id).split(':')[0]);
      writeBotStatus(botId, { status: 'connected', qrDataUrl: null, number });
      return { status: 'connected', number };
    }
    return { status: 'connecting' };
  }

  if (initializing.has(botId)) {
    return { status: 'connecting' };
  }

  initializing.add(botId);
  clearReconnectTimer(botId);
  ensureBotDir(botId);

  const sessionsDir = sessionsDirFor(botId);
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Kivo', 'Desktop', '1.0.0'],
      // CRITICAL: stop phone history resync storms
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      shouldSyncHistoryMessage: () => false,
      getMessage: async () => undefined,
    });

    activeSockets.set(botId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr);
          qrCodeCache.set(botId, qrDataUrl);
          writeBotStatus(botId, { status: 'scanning', qrDataUrl, number: null });
          await db
            .update(bots)
            .set({ whatsappStatus: 'scanning', updatedAt: new Date() })
            .where(eq(bots.id, botId))
            .catch(() => {});
          logger.info(`[Baileys] QR ready bot=${botId}`);
        } catch (e) {
          logger.error(`[Baileys] QR error: ${e.message}`);
        }
      }

      if (connection === 'open') {
        const number = sanitizePhone(String(sock.user?.id || '').split(':')[0]);
        qrCodeCache.delete(botId);
        writeBotStatus(botId, { status: 'connected', qrDataUrl: null, number });
        logger.info(`✅ [Baileys] CONNECTED bot=${botId} +${number}`);
        await db
          .update(bots)
          .set({
            whatsappNumber: `+${number}`,
            whatsappStatus: 'connected',
            phoneNumberId: number,
            updatedAt: new Date(),
          })
          .where(eq(bots.id, botId))
          .catch(() => {});
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;

        logger.warn(`[Baileys] closed bot=${botId} code=${code}`);

        qrCodeCache.delete(botId);
        activeSockets.delete(botId);
        initializing.delete(botId);

        if (loggedOut) {
          clearBotStatus(botId);
          try {
            fs.rmSync(sessionsDir, { recursive: true, force: true });
          } catch {}
          writeBotStatus(botId, {
            status: 'disconnected',
            qrDataUrl: null,
            number: null,
          });
          await db
            .update(bots)
            .set({ whatsappStatus: 'disconnected', updatedAt: new Date() })
            .where(eq(bots.id, botId))
            .catch(() => {});
          return;
        }

        // One delayed reconnect only — no storm
        writeBotStatus(botId, {
          status: 'reconnecting',
          qrDataUrl: null,
          number: null,
        });

        clearReconnectTimer(botId);
        const timer = setTimeout(() => {
          initBotSocket(botId).catch((e) =>
            logger.error(`[Baileys] reconnect fail: ${e.message}`)
          );
        }, 10000);
        reconnectTimers.set(botId, timer);
      }
    });

    // -------- MESSAGES (auto-reply) --------
    sock.ev.on('messages.upsert', async ({ type, messages: list }) => {
      try {
        if (!list?.length) return;

        for (const msg of list) {
          const remoteJid = msg?.key?.remoteJid || '';
          const fromMe = !!msg?.key?.fromMe;
          const msgId = msg?.key?.id || `${Date.now()}`;

          // Always log so we can see if WhatsApp delivers events
          logger.info(
            `[Baileys RAW] type=${type} jid=${remoteJid} fromMe=${fromMe} id=${msgId}`
          );

          if (fromMe) continue;
          if (!msg.message) continue;
          if (remoteJid === 'status@broadcast') continue;
          if (remoteJid.endsWith('@g.us')) continue;

          // Personal chats: classic JID or LID
          const okJid =
            remoteJid.endsWith('@s.whatsapp.net') ||
            remoteJid.endsWith('@lid');
          if (!okJid) continue;

          if (processedMsgIds.has(msgId)) continue;
          processedMsgIds.add(msgId);
          if (processedMsgIds.size > 5000) processedMsgIds.clear();

          const userText = extractText(msg).trim();
          if (!userText) {
            logger.info('[Baileys] skip empty/media-only message');
            continue;
          }

          const phoneSource =
            msg.key?.senderPn ||
            msg.key?.participant ||
            remoteJid;
          const fromPhone = sanitizePhone(
            String(phoneSource).split(':')[0].split('@')[0]
          );

          logger.info(
            `📩 INCOMING bot=${botId} from=+${fromPhone} text="${userText}"`
          );

          const live = activeSockets.get(botId) || sock;

          let activeBot = null;
          try {
            activeBot = await db
              .select()
              .from(bots)
              .where(eq(bots.id, botId))
              .then((r) => r[0]);
          } catch (e) {
            logger.error(`[Baileys] DB bot: ${e.message}`);
          }

          if (!activeBot) {
            await live.sendMessage(remoteJid, {
              text: 'Thanks for your message. Please try again in a moment.',
            });
            continue;
          }

          // Handoff keywords
          let kws = activeBot.handoffKeywords || [
            'human',
            'agent',
            'support',
            'manager',
          ];
          if (typeof kws === 'string') {
            try {
              kws = JSON.parse(kws);
            } catch {
              kws = ['human', 'agent'];
            }
          }
          const low = userText.toLowerCase();
          if (
            Array.isArray(kws) &&
            kws.some((k) => low.includes(String(k).toLowerCase()))
          ) {
            await live.sendMessage(remoteJid, {
              text: `Connecting you to a human at *${activeBot.businessName}*. Someone will reply soon.`,
            });
            logger.info(`🤝 handoff +${fromPhone}`);
            continue;
          }

                    // -------- KNOWLEDGE + PRODUCTS (from DB) --------
          let knowledgeItems = [];
          let productItems = [];

          try {
            const sources = await db
              .select()
              .from(knowledgeSources)
              .where(eq(knowledgeSources.botId, activeBot.id));

            knowledgeItems = (sources || [])
              .filter((s) => !s.status || s.status === 'ready')
              .map((s) => ({
                name: s.name || 'Knowledge',
                type: s.type || 'text',
                content: (s.rawContent || '').trim(),
              }))
              .filter((s) => s.content.length > 0);

            // Fallback: workspace-level knowledge if bot-specific empty
            if (knowledgeItems.length === 0) {
              const wsSources = await db
                .select()
                .from(knowledgeSources)
                .where(eq(knowledgeSources.workspaceId, activeBot.workspaceId));

              knowledgeItems = (wsSources || [])
                .filter((s) => !s.status || s.status === 'ready')
                .map((s) => ({
                  name: s.name || 'Knowledge',
                  type: s.type || 'text',
                  content: (s.rawContent || '').trim(),
                }))
                .filter((s) => s.content.length > 0);
            }
          } catch (e) {
            logger.warn(`[Baileys] knowledge load failed: ${e.message}`);
          }

          try {
            const rows = await db
              .select()
              .from(products)
              .where(eq(products.workspaceId, activeBot.workspaceId));

            productItems = (rows || [])
              .filter((p) => p.isActive !== false)
              .map((p) => ({
                name: p.name,
                category: p.category || 'General',
                price: p.price,
                currency: p.currency || 'NGN',
                sku: p.sku || '',
                description: p.description || '',
              }));
          } catch (e) {
            logger.warn(`[Baileys] products load failed: ${e.message}`);
          }

          const knowledgeContext = buildKnowledgeContext(knowledgeItems);
          const productContext = buildProductContext(productItems);

          logger.info(
            `[Baileys] KB context bot=${activeBot.id} knowledge=${knowledgeItems.length} products=${productItems.length}`
          );

          // Always inject KB/products. Override alone must NOT drop knowledge.
          const basePrompt = buildSystemPrompt({
            botName: activeBot.name,
            businessName: activeBot.businessName,
            industry: activeBot.industry,
            personality: activeBot.personality || 'professional',
            language: activeBot.language || 'en',
            objectives: activeBot.objectives || [],
            rules: activeBot.rules || [],
            restrictions: activeBot.restrictions || [],
            knowledgeContext,
            productContext,
          });

          const systemPrompt = activeBot.systemPromptOverride
            ? `${activeBot.systemPromptOverride}

[VERIFIED KNOWLEDGE BASE CONTEXT]
${knowledgeContext}

[AVAILABLE PRODUCTS & SERVICES CATALOG]
${productContext}`
            : basePrompt;

          let reply =
            activeBot.fallbackMessage ||
            'Hello! Thanks for reaching out. How can I help?';

          try {
            const ai = await generateAiResponse({
              messages: [{ role: 'user', content: userText }],
              systemPrompt,
              primaryProvider: activeBot.primaryProvider || 'openrouter',
              primaryModel:
                activeBot.primaryModel || 'google/gemini-2.5-flash',
              fallbackProvider: activeBot.fallbackProvider || 'groq',
              fallbackModel: 'llama-3.1-8b-instant',
              temperature: Number(activeBot.temperature || 0.3),
              maxTokens: Number(activeBot.maxTokens || 400),
              workspaceId: activeBot.workspaceId,
              botId: activeBot.id,
            });
            if (ai?.text) reply = ai.text;
          } catch (e) {
            logger.error(`[Baileys AI] ${e.message}`);
          }

          await live.sendMessage(remoteJid, { text: reply });
          logger.info(`🚀 AUTO-REPLY sent to ${remoteJid}`);

          // DB optional — never block reply
          const workspaceId = activeBot.workspaceId;
          try {
            let customer = await db
              .select()
              .from(customers)
              .where(
                and(
                  eq(customers.workspaceId, workspaceId),
                  eq(customers.phoneNumber, fromPhone || remoteJid)
                )
              )
              .then((r) => r[0]);

            if (!customer) {
              customer = {
                id: generateId('cust'),
                workspaceId,
                phoneNumber: fromPhone || remoteJid,
                name: msg.pushName || 'Customer',
              };
              await db.insert(customers).values(customer).catch(() => {});
            }

            let conv = await db
              .select()
              .from(conversations)
              .where(
                and(
                  eq(conversations.workspaceId, workspaceId),
                  eq(conversations.customerId, customer.id),
                  eq(conversations.botId, botId)
                )
              )
              .then((r) => r[0]);

            if (!conv) {
              conv = {
                id: generateId('conv'),
                workspaceId,
                botId,
                customerId: customer.id,
                channel: 'whatsapp',
                mode: 'ai',
                status: 'open',
                lastMessageSnippet: userText,
              };
              await db.insert(conversations).values(conv).catch(() => {});
            }

            await db
              .insert(messages)
              .values({
                id: generateId('msg'),
                workspaceId,
                conversationId: conv.id,
                senderType: 'customer',
                content: userText,
                externalMessageId: msgId,
              })
              .catch(() => {});

            await db
              .insert(messages)
              .values({
                id: generateId('msg'),
                workspaceId,
                conversationId: conv.id,
                senderType: 'bot',
                content: reply,
              })
              .catch(() => {});
          } catch (e) {
            logger.warn(`[Baileys] db skip: ${e.message}`);
          }
        }
      } catch (e) {
        logger.error(`[Baileys upsert] ${e.message}`);
      }
    });

    writeBotStatus(botId, {
      status: 'connecting',
      qrDataUrl: null,
      number: null,
    });

    return { status: 'initializing' };
  } catch (e) {
    logger.error(`[Baileys init] ${e.message}`);
    activeSockets.delete(botId);
    writeBotStatus(botId, {
      status: 'error',
      qrDataUrl: null,
      number: null,
      error: e.message,
    });
    throw e;
  } finally {
    initializing.delete(botId);
  }
}

export function getBotSocketStatus(botId) {
  if (activeSockets.has(botId)) {
    const sock = activeSockets.get(botId);
    if (sock?.user) {
      return {
        status: 'connected',
        number: sanitizePhone(String(sock.user.id).split(':')[0]),
        qrDataUrl: null,
      };
    }
  }
  if (qrCodeCache.has(botId)) {
    return {
      status: 'scanning',
      qrDataUrl: qrCodeCache.get(botId),
      number: null,
    };
  }
  return readBotStatus(botId);
}

export function hasActiveSocket(botId) {
  const s = activeSockets.get(botId);
  return !!(s && s.user);
}

export async function disconnectBotSocket(botId) {
  clearReconnectTimer(botId);
  const sock = activeSockets.get(botId);
  if (sock) {
    try {
      await sock.logout();
    } catch {}
    try {
      sock.end?.(undefined);
    } catch {}
  }
  activeSockets.delete(botId);
  qrCodeCache.delete(botId);
  clearBotStatus(botId);

  const dir = sessionsDirFor(botId);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
  ensureBotDir(botId);
  writeBotStatus(botId, {
    status: 'disconnected',
    qrDataUrl: null,
    number: null,
  });

  await db
    .update(bots)
    .set({ whatsappStatus: 'disconnected', updatedAt: new Date() })
    .where(eq(bots.id, botId))
    .catch(() => {});

  return { success: true };
}