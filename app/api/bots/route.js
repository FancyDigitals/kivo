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

    const botsList = await db
      .select()
      .from(bots)
      .where(eq(bots.workspaceId, workspaceId));

    return NextResponse.json({
      success: true,
      data: botsList,
    });
  } catch (error) {
    logger.error('Error fetching bots from database', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Database fetch failed',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { workspaceId } = await getAuthContext(request);

    const body = await request.json();
    const botId = String(body?.id || '').trim();

    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot ID is required.',
        },
        { status: 400 }
      );
    }

    const bot = await db
      .select()
      .from(bots)
      .where(eq(bots.id, botId))
      .then((rows) => rows[0]);

    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot not found.',
        },
        { status: 404 }
      );
    }

    if (bot.workspaceId !== workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to delete this bot.',
        },
        { status: 403 }
      );
    }

    await db
      .delete(bots)
      .where(eq(bots.id, botId));

    return NextResponse.json({
      success: true,
      message: 'Bot deleted successfully.',
    });
  } catch (error) {
    logger.error('Bot deletion failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to delete bot.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const body = await request.json();

    const {
      name,
      businessName,
      industry = 'business',
      description,
      capabilities = [],
      personality = 'professional',
      language = 'en',
      contactInfo,
      businessHours,
      seedKnowledge = '',
    } = body;

    const isPersonal = industry === 'personal';

    /*
     * ---------------------------------------------------------
     * VALIDATION
     * ---------------------------------------------------------
     */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot Name is required.',
        },
        { status: 400 }
      );
    }

    /*
     * Business bots need a business name.
     *
     * Personal bots do not.
     * For personal bots we use the person's name as the
     * internal businessName value so the existing database
     * structure remains compatible.
     */
    const resolvedBusinessName = isPersonal
      ? name
      : businessName;

    if (!isPersonal && !businessName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business Name is required for business bots.',
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * AI CONFIGURATION SYNTHESIS
     * ---------------------------------------------------------
     */

    logger.info(
      `Synthesizing ${
        isPersonal ? 'personal digital twin' : 'business'
      } configuration for bot: ${name}`
    );

    const synthesisPrompt = isPersonal
      ? `
You are the Personal AI Persona Architect for Kivo.

You are creating a personal AI assistant that represents a real person.

The objective is NOT to make the assistant sound like a generic customer-service chatbot.

The objective is to make the assistant communicate naturally in a way that reflects the person's actual:
- personality
- communication style
- vocabulary
- preferences
- background
- interests
- conversational habits
- level of formality
- way of explaining things
- commonly used expressions

IMPORTANT:
Only use information explicitly provided in the person's profile.
Never invent facts, memories, relationships, experiences, opinions, achievements, or personal history.

The AI should feel like a natural digital version of the person, while still being transparent when necessary that it is an AI representation.

PERSON'S NAME:
${name}

PERSONALITY PRESET:
${personality}

LANGUAGE:
${language}

PROFILE / DESCRIPTION:
${description || 'No detailed profile provided.'}

PERSONAL KNOWLEDGE:
${seedKnowledge || 'No additional personal knowledge provided.'}

CONTACT INFORMATION:
${contactInfo || 'N/A'}

Generate strictly valid JSON.

{
  "welcomeMessage": "A natural first-person WhatsApp introduction, not a corporate greeting.",
  "objectives": [
    "Array of 3 objectives for representing this person naturally"
  ],
  "rules": [
    "Array of 6 detailed communication rules"
  ],
  "restrictions": [
    "Array of 5 safety and identity boundaries"
  ]
}

The communication rules should prioritize:
1. Natural human conversation.
2. First-person responses where appropriate.
3. Matching the person's stated communication style.
4. Avoiding robotic or corporate language.
5. Using short WhatsApp-friendly responses where appropriate.
6. Never inventing personal information.
`.trim()
      : `
You are an expert AI Bot Architect on Kivo.

Generate a structured JSON response to configure an AI WhatsApp Bot for this business.

Bot Name:
${name}

Business Name:
${resolvedBusinessName}

Industry:
${industry}

Description:
${description || 'N/A'}

Selected Capabilities:
${capabilities.length ? capabilities.join(', ') : 'General assistance'}

Personality:
${personality}

Language:
${language}

Contact Info:
${contactInfo || 'N/A'}

Operating Hours:
${businessHours || 'N/A'}

Knowledge:
${seedKnowledge || 'N/A'}

Respond strictly with valid JSON without markdown codeblocks:

{
  "welcomeMessage": "A warm, natural WhatsApp welcome message (1-2 sentences with emojis)",
  "objectives": ["Array of 3 clear bot objectives"],
  "rules": ["Array of 4 operational guidelines for this bot"],
  "restrictions": ["Array of 3 safety restrictions"]
}
`.trim();

    /*
     * ---------------------------------------------------------
     * SAFE DEFAULT CONFIGURATION
     * ---------------------------------------------------------
     */

    let synthesizedConfig = isPersonal
      ? {
          welcomeMessage: `Hey, I'm ${name}'s AI. How can I help?`,
          objectives: [
            'Represent the person naturally',
            'Answer questions using the provided personal knowledge',
            'Maintain the person’s communication style',
          ],
          rules: [
            'Speak naturally and conversationally',
            'Use first-person language when appropriate',
            'Keep responses human and WhatsApp-friendly',
            'Match the provided personality and communication style',
            'Do not sound like a generic customer-support bot',
            'Never invent personal information',
          ],
          restrictions: [
            'Never fabricate memories or personal experiences',
            'Never invent opinions, relationships, or personal history',
            'Never claim certainty when the supplied information does not support it',
            'Be transparent when identity clarification is necessary',
            'Do not disclose private information unless explicitly provided for that purpose',
          ],
        }
      : {
          welcomeMessage: `Welcome to *${resolvedBusinessName}*! How can I assist you today?`,
          objectives: capabilities.length
            ? capabilities
            : ['Answer customer inquiries', 'Provide fast assistance'],
          rules: [
            'Maintain polite tone',
            'Be direct and clear on WhatsApp',
          ],
          restrictions: [
            'Do not provide false information',
          ],
        };

    /*
     * ---------------------------------------------------------
     * AI SYNTHESIS
     * ---------------------------------------------------------
     */

    try {
      const aiResponse = await generateAiResponse({
        messages: [
          {
            role: 'user',
            content: synthesisPrompt,
          },
        ],
        temperature: isPersonal ? 0.35 : 0.2,
      });

      const cleanedText = aiResponse.text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanedText);

      synthesizedConfig = {
        ...synthesizedConfig,
        ...parsed,
      };
    } catch (aiErr) {
      logger.warn(
        `AI synthesis fallback used during ${
          isPersonal ? 'personal' : 'business'
        } bot creation: ${aiErr.message}`
      );
    }

    /*
     * ---------------------------------------------------------
     * SYSTEM PROMPT
     * ---------------------------------------------------------
     */

    const systemPrompt = buildSystemPrompt({
      botName: name,

      /*
       * Personal bots use the person's name internally.
       * Business bots use the actual business name.
       */
      businessName: resolvedBusinessName,

      industry,

      personality,

      language,

      objectives: synthesizedConfig.objectives,

      rules: synthesizedConfig.rules,

      restrictions: synthesizedConfig.restrictions,
    });

    /*
     * ---------------------------------------------------------
     * CREATE BOT RECORD
     * ---------------------------------------------------------
     */

    const botId = generateId('bot');

    const newBotRecord = {
      id: botId,
      workspaceId,

      name,

      /*
       * Existing schema compatibility.
       * Personal bots use the person's name here.
       */
      businessName: resolvedBusinessName,

      industry,

      description: description || '',

      personality,

      language,

      status: 'active',

      primaryProvider: 'groq',
      primaryModel: 'llama-3.1-8b-instant',

      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',

      welcomeMessage: synthesizedConfig.welcomeMessage,

      fallbackMessage: isPersonal
        ? `I don't have enough information to answer that accurately.`
        : `I'll connect you with a representative from ${resolvedBusinessName} shortly.`,

      systemPromptOverride: systemPrompt,

      objectives: synthesizedConfig.objectives,

      rules: synthesizedConfig.rules,

      restrictions: synthesizedConfig.restrictions,

      /*
       * Personal bots should not pretend to be a company.
       */
      handoffKeywords: isPersonal
        ? [
            'human',
            'real person',
            'actual person',
            'talk to him',
            'talk to her',
            'speak to him',
            'speak to her',
          ]
        : [
            'human',
            'agent',
            'support',
            'manager',
            'speak to someone',
          ],
    };

    await db.insert(bots).values(newBotRecord);

    /*
     * ---------------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      data: newBotRecord,
    });
  } catch (error) {
    logger.error('Bot creation failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create bot',
      },
      { status: 500 }
    );
  }
}