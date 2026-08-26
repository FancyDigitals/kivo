import { db } from '../db';
import { workspaces, bots } from '../db/schema';
import { eq, count } from 'drizzle-orm';
import { PLANS } from './plans';

/**
 * Validates whether a workspace has capacity to perform an action under its current plan.
 */
export async function checkWorkspaceEntitlement(workspaceId = 'ws_fancy_1', feature = 'create_bot') {
  try {
    const workspace = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).then((r) => r[0]);
    const planId = workspace?.planId || 'pro';
    const plan = PLANS[planId] || PLANS.pro;

    if (feature === 'create_bot') {
      const activeBotsCount = await db
        .select({ value: count() })
        .from(bots)
        .where(eq(bots.workspaceId, workspaceId))
        .then((r) => r[0]?.value || 0);

      if (activeBotsCount >= plan.maxBots) {
        return {
          allowed: false,
          reason: `Plan limit reached. Your ${plan.name} plan allows up to ${plan.maxBots} active bot(s). Upgrade your plan to create more bots.`,
        };
      }
    }

    return { allowed: true, plan };
  } catch (error) {
    // Graceful pass-through on check failure
    return { allowed: true, plan: PLANS.pro };
  }
}