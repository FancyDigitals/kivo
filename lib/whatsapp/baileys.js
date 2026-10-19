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
  knowledgeChunks,
  products,
} from '../db/schema.js';

import { generateAiResponse } from '../ai/gateway.js';
import { buildSystemPrompt } from '../ai/prompts/builder.js';
import {
  buildKnowledgeContext,
  buildProductContext,
} from '../knowledge/retrieval.js';

import { AI_MODELS } from '../../config/providers.js';

import {
  generateId,
  sanitizePhone,
} from '../utils/helpers.js';

import { logger } from '../utils/logger.js';

/* =========================================================
   SOCKET STATE
========================================================= */

const activeSockets = new Map();
const qrCodeCache = new Map();
const initializing = new Set();
const processedMsgIds = new Set();
const reconnectTimers = new Map();
const socketGenerations = new Map();

function sessionsDirFor(botId) {
  return path.join(
    process.cwd(),
    'sessions',
    `bot_${botId}`
  );
}

function createSocketGeneration(botId) {
  const generation = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;

  socketGenerations.set(botId, generation);

  return generation;
}

function isCurrentSocket(
  botId,
  sock,
  generation
) {
  return (
    activeSockets.get(botId) === sock &&
    socketGenerations.get(botId) === generation
  );
}

function clearSocketState(
  botId,
  sock,
  generation
) {
  if (
    isCurrentSocket(
      botId,
      sock,
      generation
    )
  ) {
    activeSockets.delete(botId);
    socketGenerations.delete(botId);
  }
}

function clearReconnectTimer(botId) {
  const timer =
    reconnectTimers.get(botId);

  if (timer) {
    clearTimeout(timer);
  }

  reconnectTimers.delete(botId);
}

/* =========================================================
   MESSAGE EXTRACTION
========================================================= */

function extractText(msg) {
  const m = msg?.message;

  if (!m) return '';

  if (m.conversation) {
    return m.conversation;
  }

  if (m.extendedTextMessage?.text) {
    return m.extendedTextMessage.text;
  }

  if (m.imageMessage?.caption) {
    return m.imageMessage.caption;
  }

  if (m.videoMessage?.caption) {
    return m.videoMessage.caption;
  }

  if (
    m.buttonsResponseMessage
      ?.selectedDisplayText
  ) {
    return (
      m.buttonsResponseMessage
        .selectedDisplayText
    );
  }

  if (
    m.listResponseMessage?.title
  ) {
    return m.listResponseMessage.title;
  }

  if (
    m.templateButtonReplyMessage
      ?.selectedDisplayText
  ) {
    return (
      m.templateButtonReplyMessage
        .selectedDisplayText
    );
  }

  return '';
}

/* =========================================================
   NORMALIZE ARRAY VALUES
========================================================= */

function normalizeArray(
  value,
  fallback = []
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/* =========================================================
   KNOWLEDGE BASE
========================================================= */

async function loadBotKnowledge(bot) {
  /*
   * IMPORTANT:
   *
   * knowledgeSources.rawContent is the canonical,
   * editable Knowledge Base.
   *
   * We intentionally read it FIRST so editing a source
   * immediately affects WhatsApp replies.
   */
  try {
    const sources = await db
      .select()
      .from(knowledgeSources)
      .where(
        and(
          eq(
            knowledgeSources.botId,
            bot.id
          ),
          eq(
            knowledgeSources.workspaceId,
            bot.workspaceId
          )
        )
      );

    const validSources =
      (sources || [])
        .filter(
          (source) =>
            (!source.status ||
              source.status === 'ready') &&
            source.rawContent &&
            String(
              source.rawContent
            ).trim()
        );

    if (validSources.length > 0) {
      const items =
        validSources.map(
          (source) => ({
            id: source.id,
            name:
              source.name ||
              'Knowledge Source',
            type:
              source.type ||
              'text',
            content:
              String(
                source.rawContent
              ).trim(),
            sourceUrl:
              source.sourceUrl ||
              null,
          })
        );

      logger.info(
        `[Baileys KB] bot=${bot.id} loaded ${items.length} current sources`
      );

      return items;
    }
  } catch (error) {
    logger.error(
      `[Baileys KB] source query failed bot=${bot.id}: ${error.message}`
    );
  }

  /*
   * Fallback only when there is no usable raw source.
   */
  try {
    const chunks = await db
      .select()
      .from(knowledgeChunks)
      .where(
        and(
          eq(
            knowledgeChunks.botId,
            bot.id
          ),
          eq(
            knowledgeChunks.workspaceId,
            bot.workspaceId
          )
        )
      );

    const validChunks =
      (chunks || [])
        .filter(
          (chunk) =>
            chunk?.content &&
            String(
              chunk.content
            ).trim()
        )
        .sort(
          (a, b) =>
            Number(
              a.chunkIndex || 0
            ) -
            Number(
              b.chunkIndex || 0
            )
        );

    const items =
      validChunks.map(
        (chunk) => ({
          id: chunk.id,
          name:
            `Knowledge Base Chunk ${
              Number(
                chunk.chunkIndex || 0
              ) + 1
            }`,
          type:
            'knowledge_chunk',
          content:
            String(
              chunk.content
            ).trim(),
        })
      );

    if (items.length > 0) {
      logger.info(
        `[Baileys KB] bot=${bot.id} fallback chunks=${items.length}`
      );
    } else {
      logger.warn(
        `[Baileys KB] EMPTY bot=${bot.id} workspace=${bot.workspaceId}`
      );
    }

    return items;
  } catch (error) {
    logger.error(
      `[Baileys KB] chunk query failed bot=${bot.id}: ${error.message}`
    );

    return [];
  }
}

/* =========================================================
   PRODUCTS
========================================================= */

async function loadBotProducts(bot) {
  try {
    const rows =
      await db
        .select()
        .from(products)
        .where(
          eq(
            products.workspaceId,
            bot.workspaceId
          )
        );

    return (rows || [])
      .filter(
        (product) =>
          product.isActive !== false
      )
      .filter(
        (product) =>
          !product.botId ||
          product.botId === bot.id
      )
      .map(
        (product) => ({
          name: product.name,
          category:
            product.category ||
            'General',
          price: product.price,
          currency:
            product.currency ||
            'NGN',
          sku:
            product.sku || '',
          description:
            product.description ||
            '',
          stockStatus:
            product.stockStatus ||
            'in_stock',
          variants:
            product.variants ||
            [],
        })
      );
  } catch (error) {
    logger.warn(
      `[Baileys] product load failed bot=${bot.id}: ${error.message}`
    );

    return [];
  }
}

/* =========================================================
   BOT
========================================================= */

async function loadBot(botId) {
  try {
    const rows =
      await db
        .select()
        .from(bots)
        .where(
          eq(
            bots.id,
            botId
          )
        );

    return rows?.[0] || null;
  } catch (error) {
    logger.error(
      `[Baileys] bot lookup failed bot=${botId}: ${error.message}`
    );

    return null;
  }
}

/* =========================================================
   DATABASE WHATSAPP STATE
========================================================= */

async function updateBotWhatsAppState(
  botId,
  values
) {
  try {
    await db
      .update(bots)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        eq(
          bots.id,
          botId
        )
      );
  } catch (error) {
    logger.warn(
      `[Baileys] WhatsApp state update failed bot=${botId}: ${error.message}`
    );
  }
}

/* =========================================================
   HUMAN HANDOFF
========================================================= */

function shouldHandoffMessage(
  text,
  bot
) {
  const normalized =
    String(text || '')
      .toLowerCase()
      .trim();

  if (!normalized) {
    return false;
  }

  /*
   * Explicit human requests.
   */
  const explicitPatterns = [
    /\bspeak\s+to\s+(a\s+)?human\b/i,
    /\bspeak\s+to\s+(a\s+)?person\b/i,
    /\bspeak\s+to\s+(a\s+)?representative\b/i,
    /\btalk\s+to\s+(a\s+)?human\b/i,
    /\btalk\s+to\s+(a\s+)?person\b/i,
    /\btalk\s+to\s+(a\s+)?representative\b/i,
    /\bconnect\s+me\s+to\s+(a\s+)?human\b/i,
    /\bconnect\s+me\s+to\s+(a\s+)?person\b/i,
    /\bconnect\s+me\s+to\s+(an?\s+)?agent\b/i,
    /\bi\s+want\s+(a\s+)?human\b/i,
    /\bi\s+want\s+to\s+talk\s+to\s+(someone|a human|a person)\b/i,
    /\bcan\s+i\s+talk\s+to\s+(someone|a human|a person)\b/i,
  ];

  if (
    explicitPatterns.some(
      (pattern) =>
        pattern.test(text)
    )
  ) {
    return true;
  }

  /*
   * Only custom non-generic keywords are
   * allowed to trigger automatic handoff.
   */
  const configured =
    normalizeArray(
      bot.handoffKeywords,
      []
    )
      .map((keyword) =>
        String(keyword)
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

  const ignoredGenericWords = new Set([
    'human',
    'support',
    'help',
    'customer',
    'service',
    'manager',
    'agent',
  ]);

  return configured.some(
    (keyword) => {
      if (
        ignoredGenericWords.has(
          keyword
        )
      ) {
        return false;
      }

      const escaped =
        keyword.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );

      return new RegExp(
        `\\b${escaped}\\b`,
        'i'
      ).test(normalized);
    }
  );
}

/* =========================================================
   SOCKET INITIALIZATION
========================================================= */

export async function initBotSocket(
  botId
) {
  if (!botId) {
    throw new Error(
      'botId required'
    );
  }

  const existingSocket =
    activeSockets.get(
      botId
    );

  if (existingSocket) {
    if (existingSocket.user) {
      const number =
        sanitizePhone(
          String(
            existingSocket
              .user
              ?.id || ''
          ).split(':')[0]
        );

      writeBotStatus(
        botId,
        {
          status:
            'connected',
          qrDataUrl:
            null,
          number,
        }
      );

      return {
        status:
          'connected',
        number,
      };
    }

    return {
      status:
        'connecting',
    };
  }

  if (
    initializing.has(botId)
  ) {
    return {
      status:
        'connecting',
    };
  }

  initializing.add(botId);
  clearReconnectTimer(botId);

  ensureBotDir(botId);

  const sessionsDir =
    sessionsDirFor(
      botId
    );

  if (
    !fs.existsSync(
      sessionsDir
    )
  ) {
    fs.mkdirSync(
      sessionsDir,
      {
        recursive: true,
      }
    );
  }

  let sock = null;
  let generation =
    null;

  try {
    const {
      state,
      saveCreds,
    } =
      await useMultiFileAuthState(
        sessionsDir
      );

    const { version } =
      await fetchLatestBaileysVersion();

    generation =
      createSocketGeneration(
        botId
      );

    sock = makeWASocket({
      version,

      auth: {
        creds:
          state.creds,
        keys:
          makeCacheableSignalKeyStore(
            state.keys,
            pino({
              level:
                'silent',
            })
          ),
      },

      printQRInTerminal:
        false,

      logger:
        pino({
          level:
            'silent',
        }),

      browser: [
        'Kivoo',
        'Desktop',
        '1.0.0',
      ],

      syncFullHistory:
        false,

      markOnlineOnConnect:
        false,

      generateHighQualityLinkPreview:
        false,

      shouldSyncHistoryMessage:
        () => false,

      getMessage:
        async () =>
          undefined,
    });

    activeSockets.set(
      botId,
      sock
    );

    sock.ev.on(
      'creds.update',
      saveCreds
    );

    /* =====================================================
       CONNECTION UPDATE
    ===================================================== */

    sock.ev.on(
      'connection.update',
      async (update) => {
        if (
          !isCurrentSocket(
            botId,
            sock,
            generation
          )
        ) {
          return;
        }

        const {
          connection,
          lastDisconnect,
          qr,
        } = update;

        /* ---------------------------------------------
           QR
        --------------------------------------------- */

        if (qr) {
          try {
            const qrDataUrl =
              await QRCode.toDataURL(
                qr,
                {
                  margin: 2,
                  width: 512,
                }
              );

            if (
              !isCurrentSocket(
                botId,
                sock,
                generation
              )
            ) {
              return;
            }

            qrCodeCache.set(
              botId,
              qrDataUrl
            );

            writeBotStatus(
              botId,
              {
                status:
                  'scanning',
                qrDataUrl,
                number:
                  null,
              }
            );

            await updateBotWhatsAppState(
              botId,
              {
                whatsappStatus:
                  'scanning',
              }
            );

            logger.info(
              `[Baileys] QR ready bot=${botId}`
            );
          } catch (error) {
            logger.error(
              `[Baileys] QR generation failed bot=${botId}: ${error.message}`
            );
          }
        }

        /* ---------------------------------------------
           CONNECTED
        --------------------------------------------- */

        if (
          connection ===
          'open'
        ) {
          const current =
            isCurrentSocket(
              botId,
              sock,
              generation
            );

          if (!current) {
            return;
          }

          const rawNumber =
            String(
              sock.user?.id ||
                ''
            ).split(':')[0];

          const number =
            sanitizePhone(
              rawNumber
            );

          qrCodeCache.delete(
            botId
          );

          writeBotStatus(
            botId,
            {
              status:
                'connected',
              qrDataUrl:
                null,
              number,
            }
          );

          await updateBotWhatsAppState(
            botId,
            {
              whatsappNumber:
                number
                  ? `+${number}`
                  : null,
              whatsappStatus:
                'connected',
              phoneNumberId:
                number ||
                null,
            }
          );

          logger.info(
            `✅ [Baileys] CONNECTED bot=${botId} +${number}`
          );

          return;
        }

        /* ---------------------------------------------
           CLOSED
        --------------------------------------------- */

        if (
          connection ===
          'close'
        ) {
          const code =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          const loggedOut =
            code ===
            DisconnectReason.loggedOut;

          logger.warn(
            `[Baileys] closed bot=${botId} code=${code}`
          );

          if (
            !isCurrentSocket(
              botId,
              sock,
              generation
            )
          ) {
            return;
          }

          clearSocketState(
            botId,
            sock,
            generation
          );

          initializing.delete(
            botId
          );

          qrCodeCache.delete(
            botId
          );

          if (
            loggedOut
          ) {
            clearReconnectTimer(
              botId
            );

            clearBotStatus(
              botId
            );

            try {
              fs.rmSync(
                sessionsDir,
                {
                  recursive:
                    true,
                  force:
                    true,
                }
              );
            } catch {}

            ensureBotDir(
              botId
            );

            writeBotStatus(
              botId,
              {
                status:
                  'disconnected',
                qrDataUrl:
                  null,
                number:
                  null,
              }
            );

            await updateBotWhatsAppState(
              botId,
              {
                whatsappStatus:
                  'disconnected',
                whatsappNumber:
                  null,
                phoneNumberId:
                  null,
              }
            );

            return;
          }

          writeBotStatus(
            botId,
            {
              status:
                'reconnecting',
              qrDataUrl:
                null,
              number:
                null,
            }
          );

          await updateBotWhatsAppState(
            botId,
            {
              whatsappStatus:
                'reconnecting',
            }
          );

          clearReconnectTimer(
            botId
          );

          const timer =
            setTimeout(
              () => {
                reconnectTimers.delete(
                  botId
                );

                if (
                  activeSockets.has(
                    botId
                  ) ||
                  initializing.has(
                    botId
                  )
                ) {
                  return;
                }

                initBotSocket(
                  botId
                ).catch(
                  (error) =>
                    logger.error(
                      `[Baileys] reconnect failed bot=${botId}: ${error.message}`
                    )
                );
              },
              10000
            );

          reconnectTimers.set(
            botId,
            timer
          );
        }
      }
    );

    /* =====================================================
       INCOMING MESSAGES
    ===================================================== */

    sock.ev.on(
      'messages.upsert',
      async ({
        type,
        messages: list,
      }) => {
        if (
          !list?.length ||
          !isCurrentSocket(
            botId,
            sock,
            generation
          )
        ) {
          return;
        }

        for (const msg of list) {
          try {
            const remoteJid =
              msg?.key
                ?.remoteJid ||
              '';

            const fromMe =
              Boolean(
                msg?.key?.fromMe
              );

            const msgId =
              msg?.key?.id ||
              `${Date.now()}_${Math.random()}`;

            logger.info(
              `[Baileys RAW] type=${type} jid=${remoteJid} fromMe=${fromMe} id=${msgId}`
            );

            if (
              fromMe ||
              !msg.message
            ) {
              continue;
            }

            if (
              remoteJid ===
              'status@broadcast'
            ) {
              continue;
            }

            if (
              remoteJid.endsWith(
                '@g.us'
              )
            ) {
              continue;
            }

            const validJid =
              remoteJid.endsWith(
                '@s.whatsapp.net'
              ) ||
              remoteJid.endsWith(
                '@lid'
              );

            if (!validJid) {
              continue;
            }

            if (
              processedMsgIds.has(
                msgId
              )
            ) {
              continue;
            }

            processedMsgIds.add(
              msgId
            );

            if (
              processedMsgIds.size >
              5000
            ) {
              processedMsgIds.clear();
            }

            const userText =
              extractText(
                msg
              ).trim();

            if (!userText) {
              continue;
            }

            const phoneSource =
              msg.key?.senderPn ||
              msg.key?.participant ||
              remoteJid;

            const fromPhone =
              sanitizePhone(
                String(
                  phoneSource
                )
                  .split(':')[0]
                  .split('@')[0]
              );

            logger.info(
              `📩 INCOMING bot=${botId} from=+${fromPhone} text="${userText}"`
            );

            const live =
              activeSockets.get(
                botId
              );

            if (!live) {
              logger.warn(
                `[Baileys] no live socket bot=${botId}`
              );

              continue;
            }

            /* =========================================
               LOAD BOT
            ========================================= */

            const activeBot =
              await loadBot(
                botId
              );

            if (!activeBot) {
              continue;
            }

            /* =========================================
               HUMAN HANDOFF
            ========================================= */

            if (
              shouldHandoffMessage(
                userText,
                activeBot
              )
            ) {
              const handoffText =
                `I'll connect you to a representative from *${activeBot.businessName}*. Someone will reply soon.`;

              await live.sendMessage(
                remoteJid,
                {
                  text:
                    handoffText,
                }
              );

              logger.info(
                `[Baileys HANDOFF] bot=${botId} customer=+${fromPhone}`
              );

              continue;
            }

            /* =========================================
               LOAD KNOWLEDGE
            ========================================= */

            const knowledgeItems =
              await loadBotKnowledge(
                activeBot
              );

            const productItems =
              await loadBotProducts(
                activeBot
              );

            let knowledgeContext =
              '';

            let productContext =
              '';

            try {
              knowledgeContext =
                buildKnowledgeContext(
                  knowledgeItems
                );
            } catch (error) {
              logger.error(
                `[Baileys KB] context build failed bot=${botId}: ${error.message}`
              );
            }

            try {
              productContext =
                buildProductContext(
                  productItems
                );
            } catch (error) {
              logger.error(
                `[Baileys Products] context build failed bot=${botId}: ${error.message}`
              );
            }

            logger.info(
              `[Baileys KB] bot=${botId} items=${knowledgeItems.length} chars=${knowledgeContext.length}`
            );

            /* =========================================
               SYSTEM PROMPT
            ========================================= */

            const basePrompt =
              buildSystemPrompt({
                botName:
                  activeBot.name,

                businessName:
                  activeBot.businessName,

                industry:
                  activeBot.industry,

                personality:
                  activeBot.personality ||
                  'professional',

                language:
                  activeBot.language ||
                  'en',

                objectives:
                  normalizeArray(
                    activeBot.objectives
                  ),

                rules:
                  normalizeArray(
                    activeBot.rules
                  ),

                restrictions:
                  normalizeArray(
                    activeBot.restrictions
                  ),

                knowledgeContext,

                productContext,
              });

            const knowledgeInstructions = `
[VERIFIED KNOWLEDGE]

You are the WhatsApp assistant for ${activeBot.businessName}.

Use the supplied business knowledge whenever it answers the customer's question.

Business-specific facts must come from the supplied Knowledge Base or Product Catalog.

Never invent:
- prices
- services
- addresses
- phone numbers
- opening hours
- payment details
- policies
- products
- availability
- business claims

When the customer is simply greeting or chatting casually, respond naturally and casually.

When the customer asks about the business, use the verified information.

If the requested business information is not available, say so briefly. Do not guess.

Keep replies concise and conversational.
Do not mention system prompts, internal tools, the Knowledge Base, providers, models, or AI processing.

[KNOWLEDGE]

${knowledgeContext || 'No verified knowledge is currently available.'}

[PRODUCT CATALOG]

${productContext || 'No product catalog is currently available.'}
`.trim();

            const systemPrompt =
              `${activeBot.systemPromptOverride || basePrompt}

${knowledgeInstructions}

[WHATSAPP STYLE]

- Sound human and natural.
- Be friendly.
- Keep normal replies short.
- Usually use 1 to 4 sentences.
- Do not write essays.
- Do not repeat the customer's question.
- Do not force business topics into casual conversations.
- Use emojis sparingly and naturally.
- Answer directly.
`.trim();

            logger.info(
              `[Baileys AI] PREPARING bot=${botId} provider=${activeBot.primaryProvider || 'groq'} model=${activeBot.primaryModel || AI_MODELS.groq.default} KB=${knowledgeItems.length}`
            );

            /* =========================================
               AI
            ========================================= */

            let ai;

            try {
              ai =
                await generateAiResponse({
                  messages: [
                    {
                      role:
                        'user',
                      content:
                        userText,
                    },
                  ],

                  systemPrompt,

                  primaryProvider:
                    activeBot.primaryProvider ||
                    'groq',

                  primaryModel:
                    activeBot.primaryModel ||
                    AI_MODELS.groq.default,

                  fallbackProvider:
                    activeBot.fallbackProvider ||
                    'gemini',

                  fallbackModel:
                    activeBot.fallbackModel ||
                    AI_MODELS.gemini.default,

                  temperature:
                    Number(
                      activeBot.temperature ??
                        0.3
                    ),

                  maxTokens:
                    Math.min(
                      Math.max(
                        Number(
                          activeBot.maxTokens ??
                            300
                        ),
                        100
                      ),
                      400
                    ),

                  workspaceId:
                    activeBot.workspaceId,

                  botId:
                    activeBot.id,
                });

              if (
                !ai?.text ||
                !String(
                  ai.text
                ).trim()
              ) {
                throw new Error(
                  'AI provider returned an empty response'
                );
              }

              logger.info(
                `[Baileys AI] SUCCESS bot=${botId} provider=${ai.provider} model=${ai.model}`
              );
            } catch (error) {
              logger.error(
                `[Baileys AI] FAILED bot=${botId}: ${error.message}`
              );

              await live.sendMessage(
                remoteJid,
                {
                  text:
                    'I’m temporarily unable to process that request. Please try again shortly.',
                }
              );

              continue;
            }

            /* =========================================
               SEND RESPONSE
            ========================================= */

            const reply =
              String(
                ai.text
              ).trim();

            const currentLive =
              activeSockets.get(
                botId
              );

            if (!currentLive) {
              continue;
            }

            await currentLive.sendMessage(
              remoteJid,
              {
                text:
                  reply,
              }
            );

            logger.info(
              `🚀 AUTO-REPLY sent to ${remoteJid}`
            );

            /* =========================================
               DATABASE LOGGING
            ========================================= */

            try {
              let customer =
                await db
                  .select()
                  .from(
                    customers
                  )
                  .where(
                    and(
                      eq(
                        customers.workspaceId,
                        activeBot.workspaceId
                      ),
                      eq(
                        customers.phoneNumber,
                        fromPhone ||
                          remoteJid
                      )
                    )
                  )
                  .then(
                    (rows) =>
                      rows[0]
                  );

              if (!customer) {
                customer = {
                  id:
                    generateId(
                      'cust'
                    ),
                  workspaceId:
                    activeBot.workspaceId,
                  phoneNumber:
                    fromPhone ||
                    remoteJid,
                  name:
                    msg.pushName ||
                    'Customer',
                };

                await db
                  .insert(
                    customers
                  )
                  .values(
                    customer
                  );
              }

              let conversation =
                await db
                  .select()
                  .from(
                    conversations
                  )
                  .where(
                    and(
                      eq(
                        conversations.workspaceId,
                        activeBot.workspaceId
                      ),
                      eq(
                        conversations.customerId,
                        customer.id
                      ),
                      eq(
                        conversations.botId,
                        botId
                      )
                    )
                  )
                  .then(
                    (rows) =>
                      rows[0]
                  );

              if (!conversation) {
                conversation = {
                  id:
                    generateId(
                      'conv'
                    ),
                  workspaceId:
                    activeBot.workspaceId,
                  botId,
                  customerId:
                    customer.id,
                  channel:
                    'whatsapp',
                  mode:
                    'ai',
                  status:
                    'open',
                  lastMessageSnippet:
                    userText,
                };

                await db
                  .insert(
                    conversations
                  )
                  .values(
                    conversation
                  );
              }

              await db
                .insert(
                  messages
                )
                .values({
                  id:
                    generateId(
                      'msg'
                    ),
                  workspaceId:
                    activeBot.workspaceId,
                  conversationId:
                    conversation.id,
                  senderType:
                    'customer',
                  content:
                    userText,
                  externalMessageId:
                    msgId,
                });

              await db
                .insert(
                  messages
                )
                .values({
                  id:
                    generateId(
                      'msg'
                    ),
                  workspaceId:
                    activeBot.workspaceId,
                  conversationId:
                    conversation.id,
                  senderType:
                    'bot',
                  content:
                    reply,
                });
            } catch (error) {
              logger.warn(
                `[Baileys] message logging failed bot=${botId}: ${error.message}`
              );
            }
          } catch (messageError) {
            logger.error(
              `[Baileys message] ${messageError.message}`
            );
          }
        }
      }
    );

    /* =====================================================
       INITIAL STATUS
    ===================================================== */

    writeBotStatus(
      botId,
      {
        status:
          'connecting',
        qrDataUrl:
          null,
        number:
          null,
      }
    );

    await updateBotWhatsAppState(
      botId,
      {
        whatsappStatus:
          'connecting',
      }
    );

    return {
      status:
        'initializing',
    };
  } catch (error) {
    logger.error(
      `[Baileys init] bot=${botId}: ${error.message}`
    );

    if (
      sock &&
      activeSockets.get(
        botId
      ) === sock
    ) {
      activeSockets.delete(
        botId
      );

      socketGenerations.delete(
        botId
      );
    }

    qrCodeCache.delete(
      botId
    );

    writeBotStatus(
      botId,
      {
        status:
          'error',
        qrDataUrl:
          null,
        number:
          null,
        error:
          error.message,
      }
    );

    await updateBotWhatsAppState(
      botId,
      {
        whatsappStatus:
          'error',
      }
    );

    throw error;
  } finally {
    initializing.delete(
      botId
    );
  }
}

/* =========================================================
   STATUS
========================================================= */

export function getBotSocketStatus(
  botId
) {
  const sock =
    activeSockets.get(
      botId
    );

  if (sock) {
    if (sock.user) {
      const number =
        sanitizePhone(
          String(
            sock.user.id ||
              ''
          ).split(':')[0]
        );

      return {
        status:
          'connected',
        number,
        qrDataUrl:
          null,
      };
    }

    if (
      qrCodeCache.has(
        botId
      )
    ) {
      return {
        status:
          'scanning',
        qrDataUrl:
          qrCodeCache.get(
            botId
          ),
        number:
          null,
      };
    }

    return {
      status:
        'connecting',
      qrDataUrl:
        null,
      number:
        null,
    };
  }

  if (
    qrCodeCache.has(
      botId
    )
  ) {
    return {
      status:
        'scanning',
      qrDataUrl:
        qrCodeCache.get(
          botId
        ),
      number:
        null,
    };
  }

  return readBotStatus(
    botId
  );
}

/* =========================================================
   ACTIVE SOCKET
========================================================= */

export function hasActiveSocket(
  botId
) {
  return activeSockets.has(
    botId
  );
}

/* =========================================================
   DISCONNECT
========================================================= */

export async function disconnectBotSocket(
  botId
) {
  clearReconnectTimer(
    botId
  );

  const sock =
    activeSockets.get(
      botId
    );

  if (sock) {
    activeSockets.delete(
      botId
    );
  }

  socketGenerations.delete(
    botId
  );

  qrCodeCache.delete(
    botId
  );

  initializing.delete(
    botId
  );

  try {
    if (sock) {
      await sock.logout();
    }
  } catch (error) {
    logger.warn(
      `[Baileys] logout warning bot=${botId}: ${error.message}`
    );
  }

  try {
    sock?.end?.(
      undefined
    );
  } catch {}

  clearBotStatus(
    botId
  );

  const dir =
    sessionsDirFor(
      botId
    );

  try {
    fs.rmSync(
      dir,
      {
        recursive:
          true,
        force:
          true,
      }
    );
  } catch {}

  ensureBotDir(
    botId
  );

  writeBotStatus(
    botId,
    {
      status:
        'disconnected',
      qrDataUrl:
        null,
      number:
        null,
    }
  );

  await updateBotWhatsAppState(
    botId,
    {
      whatsappStatus:
        'disconnected',
      whatsappNumber:
        null,
      phoneNumberId:
        null,
    }
  );

  logger.info(
    `[Baileys] disconnected bot=${botId}`
  );

  return {
    success:
      true,
  };
}