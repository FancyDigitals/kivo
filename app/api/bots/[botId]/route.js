import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { buildSystemPrompt } from '@/lib/ai/prompts/builder';
import { logger } from '@/lib/utils/logger';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const botId = resolvedParams?.botId;

    let botRecord = await db.select().from(bots).where(eq(bots.id, botId)).then((res) => res[0]);

    if (!botRecord) {
      // Fallback query demo bot
      botRecord = await db.select().from(bots).where(eq(bots.id, 'bot_demo_1')).then((res) => res[0]);
    }

    if (!botRecord) {
      return NextResponse.json({ success: false, error: 'Bot not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: botRecord });
  } catch (error) {
    logger.error('Error fetching bot details from DB', error);
    return NextResponse.json({ success: false, error: 'Bot not found' }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const botId = resolvedParams?.botId || 'bot_demo_1';
    const body = await request.json();

    logger.info(`Updating bot configuration in DB for botId: ${botId}`);

    const existingBot = await db.select().from(bots).where(eq(bots.id, botId)).then((res) => res[0]);

    const updatedSystemPrompt = buildSystemPrompt({
      botName: body.name || existingBot?.name || 'Fancy Assistant',
      businessName: body.businessName || existingBot?.businessName || 'Fancy Digitals',
      industry: body.industry || existingBot?.industry || 'business',
      personality: body.personality || existingBot?.personality || 'professional',
      language: body.language || existingBot?.language || 'en',
      objectives: body.objectives || existingBot?.objectives || [],
      rules: body.rules || existingBot?.rules || [],
      restrictions: body.restrictions || existingBot?.restrictions || [],
    });

    const updateData = {
      name: body.name ?? existingBot?.name,
      businessName: body.businessName ?? existingBot?.businessName,
      personality: body.personality ?? existingBot?.personality,
      language: body.language ?? existingBot?.language,
      primaryProvider: body.primaryProvider ?? existingBot?.primaryProvider,
      primaryModel: body.primaryModel ?? existingBot?.primaryModel,
      fallbackProvider: body.fallbackProvider ?? existingBot?.fallbackProvider,
      fallbackModel: body.fallbackModel ?? existingBot?.fallbackModel,
      temperature: String(body.temperature ?? existingBot?.temperature ?? '0.3'),
      welcomeMessage: body.welcomeMessage ?? existingBot?.welcomeMessage,
      fallbackMessage: body.fallbackMessage ?? existingBot?.fallbackMessage,
      objectives: body.objectives ?? existingBot?.objectives,
      rules: body.rules ?? existingBot?.rules,
      restrictions: body.restrictions ?? existingBot?.restrictions,
      systemPromptOverride: updatedSystemPrompt,
      updatedAt: new Date(),
    };

    await db.update(bots).set(updateData).where(eq(bots.id, botId));

    return NextResponse.json({
      success: true,
      message: 'Bot configuration updated successfully in DB',
      data: { id: botId, ...updateData },
    });
  } catch (error) {
    logger.error('Error updating bot in DB', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bot' },
      { status: 500 }
    );
  }
}