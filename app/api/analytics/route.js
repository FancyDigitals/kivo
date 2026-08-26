import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiUsageLogs, conversations, bots } from '@/lib/db/schema';
import { eq, count, sum, avg } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth/getAuthContext';
import { logger } from '@/lib/utils/logger';

export async function GET(request) {
  try {
    const { workspaceId } = await getAuthContext(request);

    // 1. Total Requests Count
    const totalRequests = await db
      .select({ value: count() })
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.workspaceId, workspaceId))
      .then((r) => r[0]?.value || 0);

    // 2. Token Sums and Latency Metrics
    const usageStats = await db
      .select({
        totalTokens: sum(aiUsageLogs.totalTokens),
        totalCost: sum(aiUsageLogs.estimatedCostUsd),
        avgLatency: avg(aiUsageLogs.latencyMs),
      })
      .from(aiUsageLogs)
      .where(eq(aiUsageLogs.workspaceId, workspaceId))
      .then((r) => r[0] || {});

    // 3. Active Bots Count
    const activeBotsCount = await db
      .select({ value: count() })
      .from(bots)
      .where(eq(bots.workspaceId, workspaceId))
      .then((r) => r[0]?.value || 0);

    // 4. Total Conversations
    const totalConvsCount = await db
      .select({ value: count() })
      .from(conversations)
      .where(eq(conversations.workspaceId, workspaceId))
      .then((r) => r[0]?.value || 0);

    return NextResponse.json({
      success: true,
      data: {
        totalRequests,
        totalTokens: Number(usageStats.totalTokens || 0),
        avgLatencyMs: Math.round(Number(usageStats.avgLatency || 0)),
        totalEstimatedCostUsd: Number(usageStats.totalCost || 0).toFixed(6),
        activeBotsCount,
        totalConversations: totalConvsCount,
      },
    });
  } catch (error) {
    logger.error('Analytics query error on Neon DB', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}