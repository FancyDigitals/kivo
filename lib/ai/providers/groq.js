export async function executeGroq({
  prompt,
  messages = [],
  model,
  temperature = 0.3,
  maxTokens = 1000,
}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not configured in .env.local'
    );
  }

  const targetModel =
    model?.replace('groq/', '') ||
    'llama-3.1-8b-instant';

  const formattedMessages =
    messages.length > 0
      ? messages
      : [
          {
            role: 'user',
            content: prompt || '',
          },
        ];

  const startTime = Date.now();

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: formattedMessages,
          temperature: Number(temperature),
          max_tokens: Number(maxTokens),
        }),
      }
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `Groq model '${targetModel}' returned ${response.status}: ${errorBody}`
      );
    }

    const data = await response.json();

    const text =
      data.choices?.[0]?.message?.content?.trim() || '';

    if (!text) {
      throw new Error(
        `Groq model '${targetModel}' returned an empty response`
      );
    }

    return {
      provider: 'groq',
      model: targetModel,
      text,
      promptTokens:
        data.usage?.prompt_tokens || 0,
      completionTokens:
        data.usage?.completion_tokens || 0,
      totalTokens:
        data.usage?.total_tokens || 0,
      latencyMs,
    };
  } catch (error) {
    throw error;
  }
}