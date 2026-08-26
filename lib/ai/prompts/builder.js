import { PLATFORM_SAFETY_HEADER, BASE_PROMPT_TEMPLATES } from './system.js';

export function buildSystemPrompt({
  botName,
  businessName,
  industry,
  personality = 'professional',
  language = 'en',
  objectives = [],
  rules = [],
  restrictions = [],
  knowledgeContext = '',
  productContext = '',
}) {
  const toneInstruction = BASE_PROMPT_TEMPLATES[personality] || BASE_PROMPT_TEMPLATES.professional;

  return `
${PLATFORM_SAFETY_HEADER}

[BUSINESS PROFILE]
- Representative Name: ${botName}
- Company: ${businessName}
- Industry: ${industry}
- Language: ${language}
- Tone: ${toneInstruction}

[CORE OBJECTIVES]
${objectives.length > 0 ? objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n') : '- Help customers quickly and guide them to the right solution.'}

[CONVERSATION GUIDELINES]
${rules.length > 0 ? rules.map((r, i) => `${i + 1}. ${r}`).join('\n') : '- Be brief, helpful, and natural on WhatsApp.'}
- MANDATORY: Keep your entire reply SHORT (2-4 sentences max). Never send long lists or paragraphs.

[VERIFIED KNOWLEDGE BASE CONTEXT]
${knowledgeContext ? knowledgeContext : 'No custom knowledge articles uploaded yet.'}

[AVAILABLE PRODUCTS & SERVICES CATALOG]
${productContext ? productContext : 'No catalog items currently listed.'}
`.trim();
}