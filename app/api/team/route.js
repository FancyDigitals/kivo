import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaceMembers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils/helpers';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const membersList = await db
      .select({
        id: workspaceMembers.id,
        role: workspaceMembers.role,
        createdAt: workspaceMembers.createdAt,
        fullName: users.fullName,
        email: users.email,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, 'ws_fancy_1'));

    return NextResponse.json({ success: true, data: membersList });
  } catch (error) {
    logger.error('Failed to fetch team members', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    let existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).then((r) => r[0]);

    if (!existingUser) {
      const newUserId = generateId('usr');
      await db.insert(users).values({
        id: newUserId,
        email: email.toLowerCase().trim(),
        passwordHash: '$2a$10$UnsetInvitePasswordHash',
        fullName: email.split('@')[0],
        role: 'user',
      });
      existingUser = { id: newUserId, email, fullName: email.split('@')[0] };
    }

    const memberRecord = {
      id: generateId('member'),
      workspaceId: 'ws_fancy_1',
      userId: existingUser.id,
      role: role || 'agent',
    };

    await db.insert(workspaceMembers).values(memberRecord).onConflictDoNothing();

    return NextResponse.json({
      success: true,
      data: {
        id: memberRecord.id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        role: memberRecord.role,
      },
    });
  } catch (error) {
    logger.error('Failed to add team member', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}