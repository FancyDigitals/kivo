import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils/helpers';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const convs = await db.select().from(conversations).where(eq(conversations.workspaceId, 'ws_fancy_1'));
    return NextResponse.json({ success: true, data: convs });
  } catch (error) {
    logger.error('Failed to fetch conversations', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { conversationId, mode, newMessage } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Conversation ID required' }, { status: 400 });
    }

    const updatePayload = {};
    if (mode) updatePayload.mode = mode;
    if (newMessage) updatePayload.lastMessageSnippet = newMessage;
    updatePayload.updatedAt = new Date();

    await db.update(conversations).set(updatePayload).where(eq(conversations.id, conversationId));

    if (newMessage) {
      await db.insert(messages).values({
        id: generateId('msg'),
        workspaceId: 'ws_fancy_1',
        conversationId,
        senderType: mode === 'human' ? 'agent' : 'bot',
        content: newMessage,
      });
    }

    const updatedConv = await db.select().from(conversations).where(eq(conversations.id, conversationId)).then((r) => r[0]);

    return NextResponse.json({ success: true, data: updatedConv });
  } catch (error) {
    logger.error('Failed to update conversation', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}