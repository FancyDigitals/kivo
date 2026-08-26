import { executeOpenRouter } from './providers/openrouter.js';
import { executeGemini } from './providers/gemini.js';
import { executeGroq } from './providers/groq.js';
import { AI_MODELS } from '@/config/providers.js';
import { sanitizeWhatsAppText, generateId } from '../utils/helpers.js';
import { db } from '../db';
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
  'anthropic/claude-3.5-sonnet': { prompt: 0.003, completion: 0.015 },
  'gemini-2.0-flash': { prompt: 0.0001, completion: 0.0004 },
  'llama-3.1-8b-instant': { prompt: 0.0001, completion: 0.0002 },
  'llama-3.3-70b-versatile': { prompt: 0.00059, completion: 0.00079 },
  'default': { prompt: 0.0005, completion: 0.001 },
};

function calculateCost(model, promptTokens, completionTokens) {
  const rates = COST_ESTIMATES[model] || COST_ESTIMATES.default;
  const cost = ((promptTokens / 1000) * rates.prompt) + ((completionTokens / 1000) * rates.completion);
  return Number(cost.toFixed(6));
}

export async function generateAiResponse({
  messages,
  systemPrompt,
  primaryProvider = 'groq',
  primaryModel = AI_MODELS.groq.default,
  fallbackProvider = 'gemini',
  fallbackModel = AI_MODELS.gemini.default,
  temperature = 0.3,
  maxTokens = 300,
  workspaceId = 'ws_fancy_1',
  botId = 'bot_demo_1',
}) {
  // 1. CHECK WORKSPACE AI CREDIT BALANCE IN NEON DB
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .then((r) => r[0]);

  const currentBalance = workspace?.aiCreditsBalance ?? 500;

  if (currentBalance <= 0) {
    logger.warn(`Workspace ${workspaceId} is out of AI credits`);
    throw new Error(
      'Your workspace is out of AI credits. Please upgrade your plan or top up credits in Workspace Settings to continue.'
    );
  }

  const fullMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  const candidates = [
    { provider: primaryProvider, model: primaryModel },
    { provider: fallbackProvider, model: fallbackModel },
    { provider: 'groq', model: AI_MODELS.groq.default },
    { provider: 'gemini', model: AI_MODELS.gemini.default },
    { provider: 'openrouter', model: AI_MODELS.openrouter.default },
  ];

  const providersToAttempt = candidates.filter(
    (item, idx, self) =>
      item.provider && self.findIndex((t) => t.provider === item.provider) === idx
  );

  let lastError = null;

  for (const attempt of providersToAttempt) {
    const handler = PROVIDER_HANDLERS[attempt.provider];
    if (!handler) continue;

    try {
      logger.info(`AI Gateway attempting provider: ${attempt.provider} (${attempt.model})`);

      const result = await handler({
        messages: fullMessages,
        model: attempt.model,
        temperature,
        maxTokens,
      });

      const estimatedCost = calculateCost(result.model, result.promptTokens, result.completionTokens);
      const cleanReplyText = sanitizeWhatsAppText(result.text);

      // 2. DEDUCT 1 CREDIT FROM WORKSPACE IN NEON DB
      db.update(workspaces)
        .set({
          aiCreditsBalance: sql`${workspaces.aiCreditsBalance} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspaceId))
        .catch((err) => logger.warn(`Failed to deduct credit balance: ${err.message}`));

      // 3. ASYNC LOG TELEMETRY ENTRY
      db.insert(aiUsageLogs)
        .values({
          id: generateId('log'),
          workspaceId,
          botId,
          provider: result.provider,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          estimatedCostUsd: String(estimatedCost),
          latencyMs: result.latencyMs,
          success: true,
        })
        .catch((err) => logger.warn(`Failed to log telemetry: ${err.message}`));

      return {
        success: true,
        text: cleanReplyText,
        provider: result.provider,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        estimatedCostUsd: estimatedCost,
        latencyMs: result.latencyMs,
        remainingCredits: Math.max(0, currentBalance - 1),
      };
    } catch (err) {
      logger.warn(`AI Provider failed [${attempt.provider}]: ${err.message}`);
      lastError = err;
    }
  }

  logger.error('All AI Gateway providers failed', lastError);
  throw new Error(`AI service temporarily unavailable: ${lastError?.message || 'Unknown error'}`);
}