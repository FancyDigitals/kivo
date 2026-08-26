import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils/helpers';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const list = await db.select().from(products).where(eq(products.workspaceId, workspaceId));
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    logger.error('Failed to fetch products from database', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext(request);
    const body = await request.json();
    const { name, category, price, currency, sku, description } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, error: 'Name and price are required' }, { status: 400 });
    }

    const newItem = {
      id: generateId('prod'),
      workspaceId,
      botId: 'bot_demo_1',
      name,
      category: category || 'General Services',
      price: String(price),
      currency: currency || 'NGN',
      sku: sku || `FD-${Math.floor(100 + Math.random() * 900)}`,
      stockStatus: 'in_stock',
      description: description || '',
    };

    await db.insert(products).values(newItem);

    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    logger.error('Failed to insert product into database', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}