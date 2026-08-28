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

    if (!botId) {
      return NextResponse.json({ success: false, error: 'Bot ID required' }, { status: 400 });
    }

    let botRecord = await db.select().from(bots).where(eq(bots.id, botId)).then((res) => res[0]);

    if (!botRecord) {
      return NextResponse.json({ success: false, error: 'Bot not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: botRecord });
  } catch (error) {
    logger.error('Error fetching bot details from DB', error);
    return NextResponse.json({ success: false, error: error.message || 'Bot not found' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const botId = resolvedParams?.botId;
    const body = await request.json();

    if (!botId) {
      return NextResponse.json({ success: false, error: 'Bot ID is required' }, { status: 400 });
    }

    const existingBot = await db.select().from(bots).where(eq(bots.id, botId)).then((res) => res[0]);

    if (!existingBot) {
      return NextResponse.json({ success: false, error: 'Bot not found' }, { status: 404 });
    }

    const updatedSystemPrompt = buildSystemPrompt({
      botName: body.name || existingBot.name || 'Fancy Assistant',
      businessName: body.businessName || existingBot.businessName || 'Fancy Digitals',
      industry: body.industry || existingBot.industry || 'business',
      personality: body.personality || existingBot.personality || 'professional',
      language: body.language || existingBot.language || 'en',
      objectives: body.objectives || existingBot.objectives || [],
      rules: body.rules || existingBot.rules || [],
      restrictions: body.restrictions || existingBot.restrictions || [],
    });

    const updateData = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.businessName !== undefined && { businessName: body.businessName }),
      ...(body.personality !== undefined && { personality: body.personality }),
      ...(body.language !== undefined && { language: body.language }),
      ...(body.primaryProvider !== undefined && { primaryProvider: body.primaryProvider }),
      ...(body.primaryModel !== undefined && { primaryModel: body.primaryModel }),
      ...(body.fallbackProvider !== undefined && { fallbackProvider: body.fallbackProvider }),
      ...(body.fallbackModel !== undefined && { fallbackModel: body.fallbackModel }),
      ...(body.temperature !== undefined && { temperature: String(body.temperature) }),
      ...(body.welcomeMessage !== undefined && { welcomeMessage: body.welcomeMessage }),
      ...(body.fallbackMessage !== undefined && { fallbackMessage: body.fallbackMessage }),
      ...(body.objectives !== undefined && { objectives: body.objectives }),
      ...(body.rules !== undefined && { rules: body.rules }),
      ...(body.restrictions !== undefined && { restrictions: body.restrictions }),
      ...(body.whatsappNumber !== undefined && { whatsappNumber: body.whatsappNumber }),
      ...(body.whatsappStatus !== undefined && { whatsappStatus: body.whatsappStatus }),
      ...(body.phoneNumberId !== undefined && { phoneNumberId: body.phoneNumberId }),
      systemPromptOverride: updatedSystemPrompt,
      updatedAt: new Date(),
    };

    await db.update(bots).set(updateData).where(eq(bots.id, botId));

    return NextResponse.json({
      success: true,
      message: 'Bot configuration updated successfully',
      data: { id: botId, ...existingBot, ...updateData },
    });
  } catch (error) {
    logger.error('Error updating bot in DB', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bot' },
      { status: 500 }
    );
  }
}