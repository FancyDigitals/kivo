import { buildSystemPrompt } from '@/lib/ai/prompts/builder';

// Single source of truth for in-memory state across all API routes
export const botsStore = new Map();
export const knowledgeStore = new Map();
export const productsStore = new Map();

// Initialize Seed Bot for Fancy Digitals
if (!botsStore.has('bot_demo_1')) {
  botsStore.set('bot_demo_1', {
    id: 'bot_demo_1',
    workspaceId: 'ws_demo_1',
    name: 'Fancy Assistant',
    businessName: 'Fancy Digitals',
    industry: 'business',
    description: 'Leading digital transformation agency specializing in AI solutions, web development, custom software, and digital growth.',
    personality: 'professional',
    language: 'en',
    status: 'active',
    primaryProvider: 'groq',
    primaryModel: 'llama-3.1-8b-instant',
    fallbackProvider: 'gemini',
    fallbackModel: 'gemini-2.0-flash',
    temperature: '0.3',
    welcomeMessage: 'Welcome to Fancy Digitals! 🚀 How can I assist you with our AI automation, web development, or custom software services today?',
    fallbackMessage: "I'll connect you with a senior tech consultant at Fancy Digitals right away.",
    objectives: ['Assist clients with digital agency inquiries', 'Provide information on AI solutions', 'Schedule discovery calls'],
    rules: ['Be articulate, tech-savvy, and highly professional', 'Highlight Fancy Digitals capabilities'],
    restrictions: ['Do not quote binding prices without a formal scope document'],
    handoffKeywords: ['human', 'agent', 'support', 'manager', 'speak to consultant'],
    createdAt: new Date().toISOString(),
  });
}

// Initialize Seed Products
if (!productsStore.has('prod_1')) {
  productsStore.set('prod_1', {
    id: 'prod_1',
    name: 'AI WhatsApp Agent Setup',
    category: 'AI Solutions',
    price: '250000.00',
    currency: 'NGN',
    sku: 'FD-AI-01',
    stockStatus: 'in_stock',
    description: 'Turnkey autonomous AI employee deployment for WhatsApp with custom Knowledge Base ingestion.',
    createdAt: new Date().toISOString(),
  });

  productsStore.set('prod_2', {
    id: 'prod_2',
    name: 'Custom Web & Mobile App Architecture',
    category: 'Software Development',
    price: '750000.00',
    currency: 'NGN',
    sku: 'FD-DEV-02',
    stockStatus: 'in_stock',
    description: 'Bespoke Next.js & mobile application design and backend API development.',
    createdAt: new Date().toISOString(),
  });
}

// Initialize Seed Knowledge Articles
if (!knowledgeStore.has('know_1')) {
  knowledgeStore.set('know_1', {
    id: 'know_1',
    botId: 'bot_demo_1',
    name: 'Agency Services & Expertise',
    type: 'text',
    content: 'Fancy Digitals builds production-ready AI agents, WhatsApp automation bots, web applications, custom SaaS platforms, and digital marketing funnels.',
    status: 'ready',
    createdAt: new Date().toISOString(),
  });

  knowledgeStore.set('know_2', {
    id: 'know_2',
    botId: 'bot_demo_1',
    name: 'Working Hours & Consultations',
    type: 'faq',
    content: 'Operating Hours: Mon - Fri (8:00 AM - 6:00 PM West Africa Time). Virtual discovery consultations take 30 minutes and can be scheduled via WhatsApp.',
    status: 'ready',
    createdAt: new Date().toISOString(),
  });
}