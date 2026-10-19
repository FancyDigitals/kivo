/**
 * KIVO CENTRAL AI MODEL REGISTRY
 *
 * Public SaaS product.
 * These are current provider model identifiers.
 */

export const AI_MODELS = {
  openrouter: {
    default: 'openai/gpt-oss-120b',

    options: [
      {
        id: 'openai/gpt-oss-120b',
        name: 'GPT-OSS 120B',
      },
      {
        id: 'openai/gpt-oss-20b',
        name: 'GPT-OSS 20B',
      },
      {
        id: 'qwen/qwen3.8-27b',
        name: 'Qwen 3.8 27B',
      },
    ],
  },

  gemini: {
    default: 'gemini-3.8-flash',

    options: [
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
      },
      {
        id: 'gemini-3.7-flash',
        name: 'Gemini 3.7 Flash',
      },
      {
        id: 'gemini-3.6-flash',
        name: 'Gemini 3.6 Flash',
      },
    ],
  },

  groq: {
    default: 'openai/gpt-oss-120b',

    options: [
      {
        id: 'openai/gpt-oss-120b',
        name: 'GPT-OSS 120B',
      },
      {
        id: 'openai/gpt-oss-20b',
        name: 'GPT-OSS 20B',
      },
      {
        id: 'qwen/qwen3.8-27b',
        name: 'Qwen 3.8 27B',
      },
    ],
  },
};