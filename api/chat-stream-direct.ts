import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model = "gemini-2.5-flash-latest" } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    let apiKey: string | undefined;
    let baseURL: string;
    let actualModel: string;

    if (model.startsWith("gemini")) {
      // Use Gemini with OpenAI compatibility
      apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
      
      switch (model) {
        case "gemini-2.5-flash-preview":
          actualModel = "models/gemini-2.5-flash-preview-05-20";
          break;
        case "gemini-2.5-pro-preview":
          actualModel = "models/gemini-2.5-pro-preview-06-05";
          break;
        default:
          actualModel = "models/gemini-2.5-flash-preview-05-20";
      }
    } else if (model.startsWith("gpt")) {
      // Use OpenAI directly
      apiKey = process.env.OPENAI_API_KEY;
      baseURL = "https://api.openai.com/v1/";
      
      switch (model) {
        case "gpt-4o":
          actualModel = "gpt-4o";
          break;
        case "gpt-4o-mini":
          actualModel = "gpt-4o-mini";
          break;
        default:
          actualModel = "gpt-4o-mini";
      }
    } else {
      throw new Error("Unsupported model selected");
    }

    if (!apiKey) {
      throw new Error(`API key not configured for ${model}`);
    }

    const requestBody = {
      model: actualModel,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: true,
      temperature: 0.7,
    };

    const response = await fetch(`${baseURL}chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Failed to get response stream");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              // Send the content as server-sent event
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON chunks
            continue;
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error("Streaming error:", error);
    res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}\n\n`);
    res.end();
  }
}
