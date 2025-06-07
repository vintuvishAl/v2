import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalAction, mutation, query } from "./_generated/server";

const persistentTextStreaming = new PersistentTextStreaming(components.persistentTextStreaming);

export const createChat = mutation({
  args: {
    prompt: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("=== CREATE CHAT START ===");
    console.log("Prompt:", args.prompt.substring(0, 100) + "...");
    console.log("Model:", args.model);
    
    const streamId = await persistentTextStreaming.createStream(ctx);
    console.log("Created stream ID:", streamId);

    const chatId = await ctx.db.insert("chats", {
      title: args.prompt.slice(0, 50) + (args.prompt.length > 50 ? "..." : ""),
      prompt: args.prompt,
      streamId,
      createdAt: Date.now(),
    });
    
    console.log("Created chat ID:", chatId);

    // Trigger streaming via internal action
    const selectedModel = args.model || "gemini-2.5-flash";
    console.log("Triggering streaming with model:", selectedModel);
    
    await ctx.scheduler.runAfter(0, internal.chat.triggerStreaming, {
      streamId,
      prompt: args.prompt,
      model: selectedModel,
    });

    return { chatId, streamId };
  },
});

export const triggerStreaming = internalAction({
  args: {
    streamId: v.string(),
    prompt: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("=== TRIGGER STREAMING START ===");
    console.log("StreamId:", args.streamId);
    console.log("Model:", args.model);
    console.log("Prompt:", args.prompt.substring(0, 100) + "...");
    
    const convexUrl = process.env.CONVEX_SITE_URL;
    if (!convexUrl) {
      console.error("CONVEX_SITE_URL not set");
      return;
    }
    
    console.log("Convex URL:", convexUrl);
    const requestUrl = `${convexUrl}/chat-stream`;
    console.log("Making request to:", requestUrl);
    
    const requestBody = {
      streamId: args.streamId,
      prompt: args.prompt,
      model: args.model,
    };
    
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("HTTP response status:", response.status);
      console.log("HTTP response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP request failed:", response.status, response.statusText);
        console.error("Error response:", errorText);
      } else {
        console.log("HTTP request successful");
      }
    } catch (error) {
      console.error("Failed to trigger streaming:", error);
    }
  },
});

export const getChatBody = query({
  args: { streamId: v.string() },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(ctx, args.streamId as any);
  },
});

export const getChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

export const getUserChats = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .order("desc")
      .collect();
  },
});
