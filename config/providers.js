/**
 * KIVO CENTRAL AI MODEL REGISTRY
 * Up-to-date active model identifiers for OpenRouter, Gemini, and Groq.
 */

export const AI_MODELS = {
  openrouter: {
    default: 'google/gemini-2.0-flash-001',
    options: [
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (Fast & Free Tier)' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (High Accuracy)' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3' },
    ],
  },
  gemini: {
    default: 'gemini-2.0-flash',
    options: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Recommended)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
  },
  groq: {
    default: 'llama-3.3-70b-versatile',
    options: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Ultra Fast)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    ],
  },
};