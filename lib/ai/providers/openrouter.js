export async function executeOpenRouter({ prompt, messages, model, temperature = 0.3, maxTokens = 1000 }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env.local');
  }

  const candidateModels = [
    model,
    'google/gemini-2.0-flash-001',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openrouter/auto',
  ].filter((m, i, self) => m && self.indexOf(m) === i);

  const formattedMessages = messages && messages.length > 0
    ? messages
    : [{ role: 'user', content: prompt }];

  let lastError = null;

  for (const targetModel of candidateModels) {
    const startTime = Date.now();
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Kivo Platform',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: formattedMessages,
          temperature: Number(temperature),
          max_tokens: Number(maxTokens),
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices?.[0];
        return {
          provider: 'openrouter',
          model: data.model || targetModel,
          text: choice?.message?.content || '',
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          latencyMs,
        };
      }

      const errorBody = await response.text();
      lastError = new Error(`OpenRouter model '${targetModel}' returned ${response.status}: ${errorBody}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All OpenRouter candidate models failed.');
}