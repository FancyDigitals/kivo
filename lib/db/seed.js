import 'dotenv/config';
import { db } from './index.js';
import { users, workspaces, bots, products } from './schema.js';
import { generateId } from '../utils/helpers.js';

async function seedDatabase() {
  console.log('🌱 Connecting to Neon PostgreSQL Cloud...');

  try {
    const adminUserId = generateId('usr');
    const workspaceId = 'ws_fancy_1';
    const botId = 'bot_demo_1';

    // 1. Seed Admin User
    await db.insert(users).values({
      id: adminUserId,
      email: 'admin@fancydigitals.com',
      passwordHash: '$2a$10$P/k4E7L1L03iP3n09V/ydeGkFjK6vX7XJ8eX9u8f7g6h5j4k3l2m1',
      fullName: 'Fancy Digitals Admin',
      role: 'admin',
    }).onConflictDoNothing();

    // 2. Seed Workspace
    await db.insert(workspaces).values({
      id: workspaceId,
      name: 'Fancy Digitals',
      slug: 'fancy-digitals',
      ownerId: adminUserId,
      planId: 'pro',
    }).onConflictDoNothing();

    // 3. Seed Bot
    await db.insert(bots).values({
      id: botId,
      workspaceId: workspaceId,
      name: 'Fancy Assistant',
      businessName: 'Fancy Digitals',
      industry: 'business',
      description: 'Digital agency specializing in AI solutions, web applications, and custom software.',
      personality: 'professional',
      language: 'en',
      status: 'active',
      primaryProvider: 'groq',
      primaryModel: 'llama-3.1-8b-instant',
      welcomeMessage: 'Welcome to *Fancy Digitals*! 🚀 How can I help with your AI, web, or software project today?',
    }).onConflictDoNothing();

    // 4. Seed Products
    await db.insert(products).values([
      {
        id: generateId('prod'),
        workspaceId,
        botId,
        name: 'AI WhatsApp Agent Setup',
        category: 'AI Solutions',
        price: '250000.00',
        currency: 'NGN',
        sku: 'FD-AI-01',
        description: 'Turnkey autonomous AI employee deployment for WhatsApp with custom Knowledge Base ingestion.',
      },
      {
        id: generateId('prod'),
        workspaceId,
        botId,
        name: 'Custom Web & Mobile App Architecture',
        category: 'Software Development',
        price: '750000.00',
        currency: 'NGN',
        sku: 'FD-DEV-02',
        description: 'Bespoke Next.js & mobile application design and backend API development.',
      }
    ]).onConflictDoNothing();

    console.log('✅ Success! Live Neon database fully seeded with Fancy Digitals schema!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();