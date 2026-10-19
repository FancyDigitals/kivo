import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

process.on('uncaughtException', (err) => {
  console.error(
    '[bot] kept alive after:',
    err?.message || err
  );
});

process.on('unhandledRejection', (err) => {
  console.error('[bot] rejection:', err);
});

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }

  const fs = await import('fs');
  const path = await import('path');

  const { db } = await import('./lib/db/index.js');
  const { bots } = await import('./lib/db/schema.js');

  const { eq, or } = await import('drizzle-orm');

  const {
    initBotSocket,
    disconnectBotSocket,
    hasActiveSocket,
  } = await import('./lib/whatsapp/baileys.js');

  const {
    consumeBotConnectRequest,
  } = await import(
    './lib/whatsapp/session-store.js'
  );

  const { logger } = await import(
    './lib/utils/logger.js'
  );

  logger.info('🚀 Kivoo WhatsApp engine starting...');

  /*
   * IMPORTANT:
   *
   * Prevent two initBotSocket() calls for the same bot
   * from happening at the same time.
   */
  const startingBots = new Set();

  async function startBot(botId, reason = 'unknown') {
    if (!botId) return;

    if (startingBots.has(botId)) {
      logger.info(
        `[Baileys] start ignored bot=${botId} reason=${reason} already starting`
      );
      return;
    }

    if (hasActiveSocket(botId)) {
      logger.info(
        `[Baileys] start ignored bot=${botId} reason=${reason} already active`
      );
      return;
    }

    startingBots.add(botId);

    try {
      logger.info(
        `[Baileys] starting bot=${botId} reason=${reason}`
      );

      await initBotSocket(botId);
    } catch (error) {
      logger.error(
        `[Baileys] failed to start bot=${botId}: ${error?.message || error}`
      );
    } finally {
      startingBots.delete(botId);
    }
  }

  /*
   * Restore bots that were already connected/scanning
   * when the engine starts.
   */
  const rows = await db
    .select()
    .from(bots)
    .where(
      or(
        eq(bots.whatsappStatus, 'connected'),
        eq(bots.whatsappStatus, 'scanning')
      )
    );

  for (const bot of rows) {
    await startBot(bot.id, 'engine-startup');
  }

  logger.info(
    '✅ Engine live — leave this window open.'
  );

  /*
   * Process explicit connection requests.
   *
   * This is the ONLY place where a disconnected bot
   * gets started from the dashboard.
   */
  setInterval(async () => {
    try {
      const root = path.join(
        process.cwd(),
        'sessions'
      );

      if (!fs.existsSync(root)) {
        return;
      }

      for (const name of fs.readdirSync(root)) {
        if (!name.startsWith('bot_')) {
          continue;
        }

        const botId = name.slice(4);

        /*
         * Handle logout request first.
         */
        const logout = path.join(
          root,
          name,
          'logout.request'
        );

        if (fs.existsSync(logout)) {
          try {
            fs.unlinkSync(logout);
          } catch {}

          if (startingBots.has(botId)) {
            logger.info(
              `[Baileys] logout ignored while bot is starting bot=${botId}`
            );
            continue;
          }

          if (hasActiveSocket(botId)) {
            logger.info(
              `[Baileys] disconnect requested bot=${botId}`
            );

            try {
              await disconnectBotSocket(botId);
            } catch (error) {
              logger.warn(
                `[Baileys] disconnect failed bot=${botId}: ${
                  error?.message || error
                }`
              );
            }
          }

          continue;
        }

        /*
         * Only react to an explicit connect request.
         */
        if (!consumeBotConnectRequest(botId)) {
          continue;
        }

        /*
         * Never start a second socket.
         */
        if (
          startingBots.has(botId) ||
          hasActiveSocket(botId)
        ) {
          logger.info(
            `[Baileys] connect request ignored bot=${botId} already active/starting`
          );
          continue;
        }

        await startBot(botId, 'dashboard-request');
      }
    } catch (error) {
      logger.warn(
        `[Baileys engine loop] ${error?.message || error}`
      );
    }
  }, 3000);
}

main();