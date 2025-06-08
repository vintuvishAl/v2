import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const persistentTextStreaming = new PersistentTextStreaming(components.persistentTextStreaming);

const http = httpRouter();

export const streamChat = httpAction(async (ctx, request) => {
  const { streamId, prompt, model = "gemini-1.5-flash-latest", conversationHistory = [] } = await request.json();
  
  console.log("=== STREAM CHAT START ===");
  console.log("StreamId:", streamId);
  console.log("Model:", model);
  console.log("Prompt:", prompt.substring(0, 100) + "...");
  console.log("Conversation history length:", conversationHistory.length);
  
  return persistentTextStreaming.stream(
    ctx,
    request,
    streamId,
    async (ctx, request, streamId, chunkAppender) => {
      await streamWithOpenAIFormat(prompt, chunkAppender, model, conversationHistory);
    }
  );
});

async function streamWithOpenAIFormat(
  prompt: string, 
  chunkAppender: (chunk: string) => Promise<void>, 
  model: string, 
  conversationHistory: {role: string, content: string}[] = []
) {
  console.log("=== STREAMING START ===");
  console.log("Model:", model);
  
  let apiKey: string | undefined;
  let baseURL: string;
  let actualModel: string;
  
  if (model.startsWith("gemini")) {
    // Use Gemini with OpenAI compatibility
    apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
    
    // Map our model names to Gemini API model names (OpenAI-compatible endpoint)
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
    
    if (!apiKey) {
      await chunkAppender("Error: Google Gemini API key not configured");
      return;
    }
    
    console.log("Using Gemini via OpenAI compatibility");
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
  } else {
    await chunkAppender("Error: Unsupported model selected");
    return;
  }
  try {
    // Build messages array with conversation history
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: prompt
      }
    ];

    const requestBody = {
      model: actualModel,
      messages,
      stream: true,
      temperature: 0.7,
    };
    
    console.log("Making API request to:", `${baseURL}chat/completions`);
    
    const response = await fetch(`${baseURL}chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);

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
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream completed, total chunks:", chunkCount);
        break;
      }

      chunkCount++;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              await chunkAppender(content);
            }          } catch {
            // Skip invalid JSON chunks
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

// Add authentication routes
auth.addHttpRoutes(http);

export default http;
