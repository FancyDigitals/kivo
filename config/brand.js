/**
 * KIVO CENTRAL BRAND CONFIGURATION
 * Changing brand properties here reflects across the entire application.
 */

export const BRAND = {
  name: 'Kivoo',
  tagline: 'Create your intelligent WhatsApp employee.',
  description:
    'Build, train, deploy, and manage production-ready WhatsApp AI bots for your business in minutes without writing code.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: 'support@kivo.ai',
  logo: '/logos/logo.png',

  // Theme extracted directly from the Kivo logo
  theme: {
    primaryColor: '#0B1B4B',
    primaryColorHover: '#071233',
    accentColor: '#0080FF',
    accentColorHover: '#0066DD',
    accentBright: '#00B4FF',
    cyan: '#00E5FF',
    cyanSoft: '#67E8F9',

    backgroundColor: '#F8FAFC',
    surfaceColor: '#FFFFFF',
    borderColor: '#E2E8F0',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
  },

  /**
   * Bot Creation Modes
   *
   * BUSINESS:
   * Creates an AI employee that represents an organization,
   * company, brand, school, store, etc.
   *
   * PERSONAL:
   * Creates a human-style virtual version of an individual.
   * The bot should communicate as that person rather than
   * presenting itself as a business customer-service bot.
   */
  botTypes: [
    {
      id: 'business',
      label: 'Business',
      description:
        'Create an AI employee that represents your business, brand, organization, or company.',
    },
    {
      id: 'personal',
      label: 'Personal / Human',
      description:
        'Create a virtual version of yourself or another person that communicates naturally like the real person.',
    },
  ],

  /**
   * Supported Bot Business Categories
   */
  categories: [
    {
      id: 'business',
      label: 'General Business',
      description:
        'Commercial firms, corporate agencies, and service providers',
    },
    {
      id: 'ecommerce',
      label: 'E-commerce & Retail',
      description:
        'Online stores, fashion brands, boutiques, and merchants',
    },
    {
      id: 'restaurant',
      label: 'Restaurant & Hospitality',
      description:
        'Food ordering, table bookings, menus, and reservations',
    },
    {
      id: 'school',
      label: 'School & Education',
      description:
        'Admissions, student inquiries, tuition, and announcements',
    },
    {
      id: 'real_estate',
      label: 'Real Estate',
      description:
        'Property listings, site viewings, pricing, and agent dispatch',
    },
    {
      id: 'healthcare',
      label: 'Healthcare & Clinic',
      description:
        'Appointment bookings, operating hours, and basic triage',
    },
    {
      id: 'creator',
      label: 'Creator & Personal Brand',
      description:
        'Community engagement, courses, bookings, and VIP access',
    },
    {
      id: 'ngo',
      label: 'NGO & Religious Organization',
      description:
        'Community inquiries, event schedules, and support',
    },
  ],

  /**
   * Special category for personal / human-style bots.
   *
   * This is intentionally separate from business categories.
   * When selected, the AI should behave as a virtual version
   * of the person rather than as a company representative.
   */
  personalCategory: {
    id: 'personal',
    label: 'Personal / Human',
    description:
      'A virtual version of a real person that talks, responds, and interacts naturally like them.',
  },

  /**
   * Supported Bot Personality Presets
   */
  personalities: [
    {
      id: 'professional',
      label: 'Professional & Corporate',
      description:
        'Polite, structured, articulate, and business-focused',
    },
    {
      id: 'friendly',
      label: 'Warm & Friendly',
      description:
        'Approachable, enthusiastic, helpful, and welcoming',
    },
    {
      id: 'luxury',
      label: 'Luxury & Exclusive',
      description:
        'Refined, sophisticated, elevated tone for premium brands',
    },
    {
      id: 'casual',
      label: 'Casual & Energetic',
      description:
        'Modern, punchy, conversational, and direct',
    },
    {
      id: 'expert',
      label: 'Authoritative Expert',
      description:
        'Analytical, fact-based, precise, and deeply knowledgeable',
    },

    /**
     * Human personality mode.
     *
     * Used when botType === 'personal'.
     */
    {
      id: 'human',
      label: 'Human Replica',
      description:
        'Natural, personal, spontaneous, conversational, and closely aligned with the person being represented',
    },
  ],

  /**
   * Bot Language Options
   */
  languages: [
    {
      id: 'en',
      label: 'English (Standard)',
      code: 'en-US',
    },
    {
      id: 'en_ng',
      label: 'Nigerian English',
      code: 'en-NG',
    },
    {
      id: 'pidgin',
      label: 'Nigerian Pidgin',
      code: 'pcm',
    },
    {
      id: 'yoruba',
      label: 'Yorùbá',
      code: 'yo',
    },
    {
      id: 'hausa',
      label: 'Hausa',
      code: 'ha',
    },
    {
      id: 'fr',
      label: 'French (Français)',
      code: 'fr',
    },
    {
      id: 'ar',
      label: 'Arabic (العربية)',
      code: 'ar',
    },
  ],

  /**
   * Core Capabilities selectable in business onboarding
   */
  capabilities: [
    {
      id: 'customer_support',
      label: 'Customer Support',
      desc: 'Resolve inquiries, triage issues, answer FAQs 24/7',
    },
    {
      id: 'sales_capture',
      label: 'Sales & Inquiries',
      desc: 'Present catalog, quote prices, close potential buyers',
    },
    {
      id: 'lead_generation',
      label: 'Lead Qualification',
      desc: 'Collect names, emails, budget, and purchasing intent',
    },
    {
      id: 'order_taking',
      label: 'Order Processing',
      desc: 'Capture orders, delivery addresses, and item specs',
    },
    {
      id: 'booking',
      label: 'Appointment Scheduling',
      desc: 'Book consultations, table reservations, or site visits',
    },
    {
      id: 'human_handoff',
      label: 'Human Handoff',
      desc: 'Seamlessly transfer complex conversations to your team',
    },
  ],

  /**
   * Capabilities for personal / human-style bots.
   */
  personalCapabilities: [
    {
      id: 'personal_conversation',
      label: 'Natural Conversation',
      desc: 'Talk naturally and respond conversationally like the person',
    },
    {
      id: 'personal_replies',
      label: 'Reply For Me',
      desc: 'Handle everyday WhatsApp conversations in the person’s style',
    },
    {
      id: 'personal_information',
      label: 'Personal Information',
      desc: 'Answer questions using information provided about the person',
    },
    {
      id: 'personal_schedule',
      label: 'Availability & Schedule',
      desc: 'Explain availability, plans, appointments, or preferred times',
    },
    {
      id: 'personal_handoff',
      label: 'Human Handoff',
      desc: 'Hand the conversation back to the real person when necessary',
    },
  ],
};