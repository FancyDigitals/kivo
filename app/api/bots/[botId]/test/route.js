import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bots, products, knowledgeSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateAiResponse } from '@/lib/ai/gateway';
import { buildSystemPrompt } from '@/lib/ai/prompts/builder';
import { buildKnowledgeContext, buildProductContext } from '@/lib/knowledge/retrieval';
import { logger } from '@/lib/utils/logger';

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const botId = resolvedParams?.botId || 'bot_demo_1';

    const body = await request.json();
    const { messages = [] } = body;

    // Fetch active bot from Neon DB
    let activeBot = await db.select().from(bots).where(eq(bots.id, botId)).then((res) => res[0]);

    if (!activeBot) {
      activeBot = await db.select().from(bots).where(eq(bots.id, 'bot_demo_1')).then((res) => res[0]);
    }

    // Fetch live Knowledge Base & Products from Neon DB
    const knowledgeList = await db.select().from(knowledgeSources).where(eq(knowledgeSources.workspaceId, activeBot?.workspaceId || 'ws_fancy_1'));
    const productList = await db.select().from(products).where(eq(products.workspaceId, activeBot?.workspaceId || 'ws_fancy_1'));

    const knowledgeText = buildKnowledgeContext(
      knowledgeList.map((k) => ({ name: k.name, type: k.type, content: k.rawContent }))
    );
    const productText = buildProductContext(productList);

    const systemPrompt = buildSystemPrompt({
      botName: activeBot?.name || 'Fancy Assistant',
      businessName: activeBot?.businessName || 'Fancy Digitals',
      industry: activeBot?.industry || 'business',
      personality: activeBot?.personality || 'professional',
      language: activeBot?.language || 'en',
      objectives: activeBot?.objectives || [],
      rules: activeBot?.rules || [],
      restrictions: activeBot?.restrictions || [],
      knowledgeContext: knowledgeText,
      productContext: productText,
    });

    const aiResult = await generateAiResponse({
      messages,
      systemPrompt,
      primaryProvider: activeBot?.primaryProvider || 'groq',
      primaryModel: activeBot?.primaryModel || 'llama-3.1-8b-instant',
      fallbackProvider: activeBot?.fallbackProvider || 'gemini',
      fallbackModel: activeBot?.fallbackModel || 'gemini-2.0-flash',
      temperature: Number(activeBot?.temperature || 0.3),
    });

    return NextResponse.json({
      success: true,
      data: {
        reply: aiResult.text,
        metadata: {
          provider: aiResult.provider,
          model: aiResult.model,
          promptTokens: aiResult.promptTokens,
          completionTokens: aiResult.completionTokens,
          totalTokens: aiResult.totalTokens,
          estimatedCostUsd: aiResult.estimatedCostUsd,
          latencyMs: aiResult.latencyMs,
        },
      },
    });
  } catch (error) {
    logger.error('Simulator API error executing against Neon DB', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error executing AI response' },
      { status: 500 }
    );
  }
}