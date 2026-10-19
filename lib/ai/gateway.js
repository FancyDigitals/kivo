import { executeOpenRouter } from './providers/openrouter.js';
import { executeGemini } from './providers/gemini.js';
import { executeGroq } from './providers/groq.js';
import { AI_MODELS } from '../../config/providers.js';
import { sanitizeWhatsAppText, generateId } from '../utils/helpers.js';
import { db } from '../db/index.js';
import { aiUsageLogs, workspaces } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const PROVIDER_HANDLERS = {
  openrouter: executeOpenRouter,
  gemini: executeGemini,
  groq: executeGroq,
};

const COST_ESTIMATES = {
  'google/gemini-2.0-flash-001': { prompt: 0.0001, completion: 0.0004 },
  'gemini-2.0-flash': { prompt: 0.0001, completion: 0.0004 },
  'llama-3.1-8b-instant': { prompt: 0.0001, completion: 0.0002 },
  'llama-3.3-70b-versatile': { prompt: 0.00059, completion: 0.00079 },
  default: { prompt: 0.0005, completion: 0.001 },
};

function calculateCost(model, promptTokens, completionTokens) {
  const rates =
    COST_ESTIMATES[model] || COST_ESTIMATES.default;

  return Number(
    (
      (promptTokens / 1000) * rates.prompt +
      (completionTokens / 1000) * rates.completion
    ).toFixed(6)
  );
}

export async function generateAiResponse({
  messages = [],
  systemPrompt = '',
  primaryProvider = 'groq',
  primaryModel = AI_MODELS.groq.default,
  fallbackProvider = 'gemini',
  fallbackModel = AI_MODELS.gemini.default,
  temperature = 0.3,
  maxTokens = 300,
  workspaceId,
  botId,
}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }

  if (!botId) {
    throw new Error('botId is required');
  }

  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .then((rows) => rows[0]);

  const currentBalance = workspace?.aiCreditsBalance ?? 500;

  if (currentBalance <= 0) {
    throw new Error(
      'Your workspace is out of AI credits. Please upgrade your plan or top up credits in Workspace Settings to continue.'
    );
  }

  /*
   * The system prompt is deliberately kept separate from
   * the user's message so every provider receives the
   * Knowledge Base instructions correctly.
   */
  const fullMessages = [
    ...(systemPrompt
      ? [{ role: 'system', content: systemPrompt }]
      : []),
    ...messages,
  ];

  /*
   * Try the configured primary provider first,
   * then the configured fallback.
   *
   * Do not silently jump between providers with unrelated
   * configurations because that makes debugging impossible.
   */
  const candidates = [
    {
      provider: primaryProvider,
      model: primaryModel,
    },
    {
      provider: fallbackProvider,
      model: fallbackModel,
    },
  ].filter(
    (item, index, self) =>
      item.provider &&
      self.findIndex(
        (candidate) =>
          candidate.provider === item.provider
      ) === index
  );

  let lastError = null;

  for (const attempt of candidates) {
    const handler =
      PROVIDER_HANDLERS[attempt.provider];

    if (!handler) {
      logger.warn(
        `AI provider not configured: ${attempt.provider}`
      );
      continue;
    }

    try {
      logger.info(
        `[AI Gateway] provider=${attempt.provider} model=${attempt.model} bot=${botId}`
      );

      const result = await handler({
        messages: fullMessages,
        model: attempt.model,
        temperature,
        maxTokens,
      });

      const text = String(result?.text || '').trim();

      if (!text) {
        throw new Error(
          `${attempt.provider} returned an empty response`
        );
      }

      const estimatedCost = calculateCost(
        result.model,
        result.promptTokens || 0,
        result.completionTokens || 0
      );

      const cleanReplyText =
        sanitizeWhatsAppText(text);

      /*
       * Deduct only after a successful AI response.
       */
      db.update(workspaces)
        .set({
          aiCreditsBalance:
            sql`${workspaces.aiCreditsBalance} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspaceId))
        .catch((err) =>
          logger.warn(
            `[AI Gateway] credit deduction failed: ${err.message}`
          )
        );

      /*
       * Telemetry must never block the response.
       */
      db.insert(aiUsageLogs)
        .values({
          id: generateId('log'),
          workspaceId,
          botId,
          provider: result.provider,
          model: result.model,
          promptTokens: result.promptTokens || 0,
          completionTokens:
            result.completionTokens || 0,
          totalTokens: result.totalTokens || 0,
          estimatedCostUsd: String(estimatedCost),
          latencyMs: result.latencyMs || 0,
          success: true,
        })
        .catch((err) =>
          logger.warn(
            `[AI Gateway] telemetry failed: ${err.message}`
          )
        );

      logger.info(
        `[AI Gateway] success provider=${result.provider} model=${result.model} bot=${botId}`
      );

      return {
        success: true,
        text: cleanReplyText,
        provider: result.provider,
        model: result.model,
        promptTokens: result.promptTokens || 0,
        completionTokens:
          result.completionTokens || 0,
        totalTokens: result.totalTokens || 0,
        estimatedCostUsd: estimatedCost,
        latencyMs: result.latencyMs || 0,
        remainingCredits: Math.max(
          0,
          currentBalance - 1
        ),
      };
    } catch (error) {
      lastError = error;

      logger.error(
        `[AI Gateway] ${attempt.provider} failed: ${error.message}`
      );
    }
  }

  throw new Error(
    `AI service temporarily unavailable: ${
      lastError?.message || 'Unknown error'
    }`
  );
}
