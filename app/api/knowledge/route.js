import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeSources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '@/lib/utils/helpers';
import { scrapeWebsiteUrl } from '@/lib/knowledge/ingest';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { logger } from '@/lib/utils/logger';

// ============================================================
// GET
// Fetch knowledge sources
// ============================================================
export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    const conditions = [
      eq(knowledgeSources.workspaceId, workspaceId),
    ];

    if (botId) {
      conditions.push(eq(knowledgeSources.botId, botId));
    }

    const list = await db
      .select()
      .from(knowledgeSources)
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    logger.error(
      'Failed to fetch knowledge sources from database',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Database query failed',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST
// Create knowledge source
// ============================================================
export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const body = await request.json();

    const {
      botId,
      name,
      type,
      content,
      sourceUrl,
    } = body;

    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: 'botId is required to link knowledge to a bot',
        },
        { status: 400 }
      );
    }

    let finalContent = content || '';
    let finalName = name || 'Uploaded Knowledge Source';

    // Website ingestion
    if (type === 'url' && sourceUrl) {
      const crawlResult = await scrapeWebsiteUrl(sourceUrl);

      if (!crawlResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: crawlResult.error,
          },
          { status: 400 }
        );
      }

      finalContent = crawlResult.extractedContent;
      finalName =
        name || `Website: ${crawlResult.title}`;
    }

    if (!finalName || !finalContent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and content are required',
        },
        { status: 400 }
      );
    }

    const newItem = {
      id: generateId('know'),
      workspaceId,
      botId,
      name: finalName,
      type: type || 'text',
      rawContent: finalContent,
      sourceUrl: sourceUrl || null,
      status: 'ready',
    };

    await db
      .insert(knowledgeSources)
      .values(newItem);

    logger.info(
      `Successfully added knowledge source "${finalName}" to bot ${botId}`
    );

    return NextResponse.json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    logger.error(
      'Failed to insert knowledge source into database',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT
// Update knowledge source
// ============================================================
export async function PUT(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const body = await request.json();

    const {
      id,
      botId,
      name,
      type,
      content,
      sourceUrl,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Knowledge source id is required',
        },
        { status: 400 }
      );
    }

    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: 'botId is required',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Verify the knowledge belongs to this workspace + bot
    // --------------------------------------------------------
    const existing = await db
      .select()
      .from(knowledgeSources)
      .where(
        and(
          eq(knowledgeSources.id, id),
          eq(knowledgeSources.workspaceId, workspaceId),
          eq(knowledgeSources.botId, botId)
        )
      )
      .then((rows) => rows[0]);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Knowledge source not found',
        },
        { status: 404 }
      );
    }

    let finalContent =
      typeof content === 'string'
        ? content.trim()
        : existing.rawContent;

    let finalName =
      typeof name === 'string' && name.trim()
        ? name.trim()
        : existing.name;

    let finalType =
      type || existing.type;

    let finalSourceUrl =
      sourceUrl || existing.sourceUrl || null;

    // --------------------------------------------------------
    // If editing a URL source, optionally re-crawl it
    // --------------------------------------------------------
    if (finalType === 'url' && finalSourceUrl) {
      const crawlResult =
        await scrapeWebsiteUrl(finalSourceUrl);

      if (!crawlResult.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              crawlResult.error ||
              'Failed to crawl website',
          },
          { status: 400 }
        );
      }

      finalContent =
        crawlResult.extractedContent;

      if (
        (!name || !name.trim()) &&
        crawlResult.title
      ) {
        finalName =
          `Website: ${crawlResult.title}`;
      }
    }

    if (!finalName || !finalContent) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Name and content are required',
        },
        { status: 400 }
      );
    }

    const updated = await db
      .update(knowledgeSources)
      .set({
        name: finalName,
        type: finalType,
        rawContent: finalContent,
        sourceUrl: finalSourceUrl,
        status: 'ready',
      })
      .where(
        and(
          eq(knowledgeSources.id, id),
          eq(knowledgeSources.workspaceId, workspaceId),
          eq(knowledgeSources.botId, botId)
        )
      )
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Knowledge source could not be updated',
        },
        { status: 500 }
      );
    }

    logger.info(
      `Updated knowledge source "${finalName}" (${id}) for bot ${botId}`
    );

    return NextResponse.json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    logger.error(
      'Failed to update knowledge source',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Failed to update knowledge source',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE
// Delete knowledge source
// ============================================================
export async function DELETE(request) {
  try {
    const { workspaceId } =
      await getAuthContext(request);

    const body = await request.json();

    const {
      id,
      botId,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Knowledge source id is required',
        },
        { status: 400 }
      );
    }

    if (!botId) {
      return NextResponse.json(
        {
          success: false,
          error: 'botId is required',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Verify ownership before deleting
    // --------------------------------------------------------
    const existing = await db
      .select()
      .from(knowledgeSources)
      .where(
        and(
          eq(knowledgeSources.id, id),
          eq(knowledgeSources.workspaceId, workspaceId),
          eq(knowledgeSources.botId, botId)
        )
      )
      .then((rows) => rows[0]);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Knowledge source not found',
        },
        { status: 404 }
      );
    }

    await db
      .delete(knowledgeSources)
      .where(
        and(
          eq(knowledgeSources.id, id),
          eq(knowledgeSources.workspaceId, workspaceId),
          eq(knowledgeSources.botId, botId)
        )
      );

    logger.info(
      `Deleted knowledge source "${existing.name}" (${id}) from bot ${botId}`
    );

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    logger.error(
      'Failed to delete knowledge source',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Failed to delete knowledge source',
      },
      { status: 500 }
    );
  }
}