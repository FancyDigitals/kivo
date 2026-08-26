export async function executeGemini({ prompt, messages, model, temperature = 0.3, maxTokens = 1000 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  const candidateModels = [
    model ? model.replace('google/', '').replace('models/', '') : null,
    'gemini-2.0-flash',
  ].filter((m, i, self) => m && self.indexOf(m) === i);

  let systemInstruction = null;
  const contents = [];

  if (messages && messages.length > 0) {
    for (const m of messages) {
      if (m.role === 'system') {
        systemInstruction = { parts: [{ text: m.content }] };
      } else {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        });
      }
    }
  } else {
    contents.push({ role: 'user', parts: [{ text: prompt }] });
  }

  let lastError = null;

  for (const targetModel of candidateModels) {
    const startTime = Date.now();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
      const requestBody = {
        contents,
        generationConfig: {
          temperature: Number(temperature),
          maxOutputTokens: Number(maxTokens),
        },
      };

      if (systemInstruction) {
        requestBody.systemInstruction = systemInstruction;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const replyText = candidate?.content?.parts?.[0]?.text || '';
        const promptTokens = data.usageMetadata?.promptTokenCount || 0;
        const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;

        return {
          provider: 'gemini',
          model: targetModel,
          text: replyText,
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          latencyMs,
        };
      }

      const errorBody = await response.text();
      lastError = new Error(`Gemini model '${targetModel}' returned ${response.status}: ${errorBody}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed.');
}