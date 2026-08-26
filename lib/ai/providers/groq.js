export async function executeGroq({ prompt, messages, model, temperature = 0.3, maxTokens = 1000 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in .env.local');
  }

  // Strictly active, non-decommissioned Groq models
  const candidateModels = [
    model ? model.replace('groq/', '') : null,
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
  ].filter((m, i, self) => m && self.indexOf(m) === i && !m.includes('mixtral'));

  const formattedMessages = messages && messages.length > 0
    ? messages
    : [{ role: 'user', content: prompt }];

  let lastError = null;

  for (const targetModel of candidateModels) {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
          provider: 'groq',
          model: targetModel,
          text: choice?.message?.content || '',
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          latencyMs,
        };
      }

      const errorBody = await response.text();
      lastError = new Error(`Groq model '${targetModel}' returned ${response.status}: ${errorBody}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq candidate models failed.');
}