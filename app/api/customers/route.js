import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils/helpers';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const list = await db.select().from(customers).where(eq(customers.workspaceId, 'ws_fancy_1'));
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    logger.error('Failed to fetch customers', error);
    return NextResponse.json({ success: false, error: 'Database fetch failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phoneNumber, email, tags } = body;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: 'Phone number required' }, { status: 400 });
    }

    const newCustomer = {
      id: generateId('cust'),
      workspaceId: 'ws_fancy_1',
      name: name || 'WhatsApp Contact',
      phoneNumber,
      email: email || '',
      tags: tags || ['Lead'],
      totalSpent: '0.00',
    };

    await db.insert(customers).values(newCustomer).onConflictDoNothing();

    return NextResponse.json({ success: true, data: newCustomer });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}