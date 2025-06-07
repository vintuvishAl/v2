import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { httpAction } from "./_generated/server";

const persistentTextStreaming = new PersistentTextStreaming(components.persistentTextStreaming);

const http = httpRouter();

export const streamChat = httpAction(async (ctx, request) => {
  const { streamId, prompt, model = "gemini-2.5-flash" } = await request.json();
  
  console.log("=== STREAM CHAT START ===");
  console.log("StreamId:", streamId);
  console.log("Model:", model);
  console.log("Prompt:", prompt.substring(0, 100) + "...");
  
  return persistentTextStreaming.stream(
    ctx,
    request,
    streamId,
    async (ctx, request, streamId, chunkAppender) => {
      await streamWithOpenAIFormat(prompt, chunkAppender, model);
    }
  );
});

async function streamWithOpenAIFormat(prompt: string, chunkAppender: (chunk: string) => Promise<void>, model: string) {
  console.log("=== STREAMING START ===");
  console.log("Model:", model);
    let apiKey: string | undefined;
  let baseURL: string;
  let actualModel: string;
  
  if (model.startsWith("gemini")) {
    // Use Gemini with OpenAI compatibility
    apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
    
    // Map our model names to Gemini API model names
    switch (model) {
      case "gemini-2.5-flash":
        actualModel = "gemini-2.0-flash-exp";
        break;
      case "gemini-2.5-pro":
        actualModel = "gemini-1.5-pro";
        break;
      default:
        actualModel = "gemini-2.0-flash-exp";
    }
    
    if (!apiKey) {
      await chunkAppender("Error: Google Gemini API key not configured");
      return;
    }
    
    console.log("Using Gemini via OpenAI compatibility");
    console.log("Base URL:", baseURL);
    console.log("Model:", actualModel);
  } else if (model.startsWith("gpt")) {
    // Use OpenAI directly
    apiKey = process.env.OPENAI_API_KEY;
    baseURL = "https://api.openai.com/v1/";
    
    // Map our model names to OpenAI API model names
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
    
    if (!apiKey) {
      await chunkAppender("Error: OpenAI API key not configured");
      return;
    }
    
    console.log("Using OpenAI directly");
    console.log("Base URL:", baseURL);
    console.log("Model:", actualModel);
  } else {
    await chunkAppender("Error: Unsupported model selected");
    return;
  }

  try {
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
    
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${baseURL}chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API request failed:", response.status, response.statusText);
      console.error("Error response:", errorText);
      await chunkAppender(`Error: API request failed with status ${response.status}: ${errorText}`);
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      console.error("Failed to get response stream");
      await chunkAppender("Error: Failed to get response stream");
      return;
    }

    console.log("Starting to read stream...");
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream completed, total chunks:", chunkCount);
        break;
      }

      chunkCount++;
      const chunk = decoder.decode(value);
      console.log(`Chunk ${chunkCount}:`, chunk.substring(0, 200));
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            console.log("Parsed data:", parsed);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              console.log("Content found:", JSON.stringify(content));
              await chunkAppender(content);
            }
          } catch (e) {
            console.log("Error parsing data chunk:", e);
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.error("Streaming error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    await chunkAppender(`Sorry, I encountered an error while processing your request with ${model}.`);
  }
}

http.route({
  path: "/chat-stream",
  method: "POST", 
  handler: streamChat,
});

export default http;
