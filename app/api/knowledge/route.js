import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeSources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '@/lib/utils/helpers';
import { scrapeWebsiteUrl } from '@/lib/knowledge/ingest';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { logger } from '@/lib/utils/logger';

// 1. GET ALL KNOWLEDGE SOURCES (Optionally filtered by ?botId=xxx)
export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    let query;
    if (botId) {
      query = db
        .select()
        .from(knowledgeSources)
        .where(
          and(
            eq(knowledgeSources.workspaceId, workspaceId),
            eq(knowledgeSources.botId, botId)
          )
        );
    } else {
      query = db
        .select()
        .from(knowledgeSources)
        .where(eq(knowledgeSources.workspaceId, workspaceId));
    }

    const list = await query;
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    logger.error('Failed to fetch knowledge sources from database', error);
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    );
  }
}

// 2. CREATE NEW KNOWLEDGE SOURCE
export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const body = await request.json();
    const { botId, name, type, content, sourceUrl } = body;

    // Strict validation: Do NOT fallback to 'bot_demo_1'
    if (!botId) {
      return NextResponse.json(
        { success: false, error: 'botId is required to link knowledge to a bot' },
        { status: 400 }
      );
    }

    let finalContent = content || '';
    let finalName = name || 'Uploaded Knowledge Source';

    // Website Scraping Path
    if (type === 'url' && sourceUrl) {
      const crawlResult = await scrapeWebsiteUrl(sourceUrl);
      if (!crawlResult.success) {
        return NextResponse.json(
          { success: false, error: crawlResult.error },
          { status: 400 }
        );
      }
      finalContent = crawlResult.extractedContent;
      finalName = name || `Website: ${crawlResult.title}`;
    }

    if (!finalName || !finalContent) {
      return NextResponse.json(
        { success: false, error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const newItem = {
      id: generateId('know'),
      workspaceId,
      botId, // Linked strictly to the provided botId
      name: finalName,
      type: type || 'text',
      rawContent: finalContent,
      sourceUrl: sourceUrl || null,
      status: 'ready',
    };

    await db.insert(knowledgeSources).values(newItem);

    logger.info(`Successfully added knowledge source "${finalName}" to bot ${botId}`);

    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    logger.error('Failed to insert knowledge source into database', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}