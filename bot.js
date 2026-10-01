import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('[bot] kept alive after:', err?.message || err);
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
  const { consumeBotConnectRequest } = await import(
    './lib/whatsapp/session-store.js'
  );
  const { logger } = await import('./lib/utils/logger.js');

  logger.info('🚀 Kivo WhatsApp engine starting...');

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
    await initBotSocket(bot.id);
  }

  logger.info('✅ Engine live — leave this window open. Close the WhatsApp page if it keeps polling.');

  setInterval(async () => {
    try {
      const root = path.join(process.cwd(), 'sessions');
      if (!fs.existsSync(root)) return;

      for (const name of fs.readdirSync(root)) {
        if (!name.startsWith('bot_')) continue;
        const botId = name.slice(4);

        const logout = path.join(root, name, 'logout.request');
        if (fs.existsSync(logout)) {
          try {
            fs.unlinkSync(logout);
          } catch {}
          await disconnectBotSocket(botId);
          continue;
        }

        if (!consumeBotConnectRequest(botId)) continue;
        if (hasActiveSocket(botId)) continue; // already up — ignore UI
        await initBotSocket(botId);
      }
    } catch (e) {
      logger.warn(e.message);
    }
  }, 3000);
}

main();