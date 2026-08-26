import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateAiResponse } from '@/lib/ai/gateway';
import { buildSystemPrompt } from '@/lib/ai/prompts/builder';
import { generateId } from '@/lib/utils/helpers';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const botsList = await db.select().from(bots).where(eq(bots.workspaceId, workspaceId));
    return NextResponse.json({ success: true, data: botsList });
  } catch (error) {
    logger.error('Error fetching bots from database', error);
    return NextResponse.json({ success: false, error: 'Database fetch failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const body = await request.json();
    const {
      name,
      businessName,
      industry,
      description,
      capabilities = [],
      personality = 'professional',
      language = 'en',
      contactInfo,
      businessHours,
    } = body;

    if (!name || !businessName) {
      return NextResponse.json(
        { success: false, error: 'Bot Name and Business Name are required.' },
        { status: 400 }
      );
    }

    logger.info(`Synthesizing AI configuration for bot: ${name} (${businessName})`);

    const synthesisPrompt = `
You are an expert AI Bot Architect on Kivo.
Generate a structured JSON response to configure an AI WhatsApp Bot for this business:

- Bot Name: ${name}
- Business Name: ${businessName}
- Industry: ${industry}
- Description: ${description}
- Selected Capabilities: ${capabilities.join(', ')}
- Personality: ${personality}
- Language: ${language}
- Contact Info: ${contactInfo || 'N/A'}
- Operating Hours: ${businessHours || 'N/A'}

Respond strictly with valid JSON without markdown codeblocks:
{
  "welcomeMessage": "A warm, natural WhatsApp welcome message (1-2 sentences with emojis)",
  "objectives": ["Array of 3 clear bot objectives"],
  "rules": ["Array of 4 operational guidelines for this bot"],
  "restrictions": ["Array of 3 safety restrictions"]
}
`.trim();

    let synthesizedConfig = {
      welcomeMessage: `Welcome to *${businessName}*! How can I assist you today?`,
      objectives: capabilities.length ? capabilities : ['Answer customer inquiries', 'Provide fast assistance'],
      rules: ['Maintain polite tone', 'Be direct and clear on WhatsApp'],
      restrictions: ['Do not provide false information'],
    };

    try {
      const aiResponse = await generateAiResponse({
        messages: [{ role: 'user', content: synthesisPrompt }],
        temperature: 0.2,
      });

      const cleanedText = aiResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      synthesizedConfig = { ...synthesizedConfig, ...parsed };
    } catch (aiErr) {
      logger.warn(`AI Synthesis fallback used during bot creation: ${aiErr.message}`);
    }

    const systemPrompt = buildSystemPrompt({
      botName: name,
      businessName,
      industry,
      personality,
      language,
      objectives: synthesizedConfig.objectives,
      rules: synthesizedConfig.rules,
      restrictions: synthesizedConfig.restrictions,
    });

    const botId = generateId('bot');

    const newBotRecord = {
      id: botId,
      workspaceId,
      name,
      businessName,
      industry: industry || 'business',
      description: description || '',
      personality,
      language,
      status: 'active',
      primaryProvider: 'groq',
      primaryModel: 'llama-3.1-8b-instant',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
      welcomeMessage: synthesizedConfig.welcomeMessage,
      fallbackMessage: `I'll connect you with a representative from ${businessName} shortly.`,
      systemPromptOverride: systemPrompt,
      objectives: synthesizedConfig.objectives,
      rules: synthesizedConfig.rules,
      restrictions: synthesizedConfig.restrictions,
      handoffKeywords: ['human', 'agent', 'support', 'manager', 'speak to someone'],
    };

    await db.insert(bots).values(newBotRecord);

    return NextResponse.json({
      success: true,
      data: newBotRecord,
    });
  } catch (error) {
    logger.error('Bot creation failed', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bot' },
      { status: 500 }
    );
  }
}