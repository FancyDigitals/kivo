export async function executeGemini({
  prompt,
  messages = [],
  model,
  temperature = 0.3,
  maxTokens = 1000,
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in .env.local'
    );
  }

  const targetModel =
    model
      ?.replace('google/', '')
      .replace('models/', '') ||
    'gemini-3.8-flash';

  let systemInstruction = null;

  const contents = [];

  if (messages.length > 0) {
    for (const message of messages) {
      if (!message?.content) continue;

      if (message.role === 'system') {
        systemInstruction = {
          parts: [
            {
              text: String(message.content),
            },
          ],
        };

        continue;
      }

      contents.push({
        role:
          message.role === 'assistant'
            ? 'model'
            : 'user',
        parts: [
          {
            text: String(message.content),
          },
        ],
      });
    }
  } else {
    contents.push({
      role: 'user',
      parts: [
        {
          text: prompt || '',
        },
      ],
    });
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [
        {
          text: prompt || '',
        },
      ],
    });
  }

  const startTime = Date.now();

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents,

      generationConfig: {
        temperature: Number(temperature),
        maxOutputTokens: Number(maxTokens),
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction =
        systemInstruction;
    }

    const response = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(requestBody),
    });

    const latencyMs =
      Date.now() - startTime;

    if (!response.ok) {
      const errorBody =
        await response.text();

      throw new Error(
        `Gemini model '${targetModel}' returned ${response.status}: ${errorBody}`
      );
    }

    const data =
      await response.json();

    const candidate =
      data.candidates?.[0];

    const text =
      candidate?.content?.parts
        ?.map((part) => part?.text || '')
        .join('')
        .trim() || '';

    if (!text) {
      throw new Error(
        `Gemini model '${targetModel}' returned an empty response`
      );
    }

    const promptTokens =
      data.usageMetadata
        ?.promptTokenCount || 0;

    const completionTokens =
      data.usageMetadata
        ?.candidatesTokenCount || 0;

    return {
      provider: 'gemini',
      model: targetModel,
      text,
      promptTokens,
      completionTokens,
      totalTokens:
        promptTokens +
        completionTokens,
      latencyMs,
    };
  } catch (error) {
    throw error;
  }
}