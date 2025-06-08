import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { utilityAgent } from "./agents";
import { auth } from "./auth";

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
      chatId,
    });

    return { chatId, streamId };
  },
});

export const triggerStreaming = internalAction({
  args: {
    streamId: v.string(),
    prompt: v.string(),
    model: v.string(),
    chatId: v.optional(v.id("chats")),
  },
  handler: async (ctx, args) => {
    console.log("=== TRIGGER STREAMING START ===");
    console.log("StreamId:", args.streamId);
    console.log("Model:", args.model);
    console.log("Prompt:", args.prompt.substring(0, 100) + "...");
    console.log("Chat ID:", args.chatId);
      // Get conversation history if we have a chat ID
    let conversationHistory: {role: string, content: string}[] = [];
    if (args.chatId) {
      try {
        const chatMessages = await ctx.runQuery(internal.chat.getChatMessagesForStreaming, {
          chatId: args.chatId
        });
          if (chatMessages && chatMessages.length > 0) {
          conversationHistory = chatMessages.map((msg: {role: string, content: string}) => ({
            role: msg.role,
            content: msg.content
          }));
          console.log("Retrieved conversation history:", conversationHistory.length, "messages");
        }
      } catch (error) {
        console.error("Error retrieving conversation history:", error);
      }
    }
    
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
      conversationHistory, // Include conversation history
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
        
        // Schedule a follow-up action to save the AI response after streaming completes
        if (args.chatId) {
          await ctx.scheduler.runAfter(5000, internal.chat.saveStreamedResponse, {
            chatId: args.chatId,
            streamId: args.streamId,
            model: args.model,
          });
        }
      }
    } catch (error) {
      console.error("Failed to trigger streaming:", error);
    }
  },
});

// Internal action to save the streamed response after completion
export const saveStreamedResponse = internalAction({
  args: {
    chatId: v.id("chats"),
    streamId: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("=== SAVE STREAMED RESPONSE ===");
    console.log("Chat ID:", args.chatId);
    console.log("Stream ID:", args.streamId);
    
    try {
      const streamBody = await persistentTextStreaming.getStreamBody(ctx, args.streamId as any);
      if (streamBody) {
        let responseText = "";
        if (typeof streamBody === "string") {
          responseText = streamBody;
        } else if (streamBody && typeof streamBody === "object") {
          const streamBodyAny = streamBody as any;
          responseText = streamBodyAny.text || streamBodyAny.body || "";
        }
        
        if (responseText.trim()) {
          await ctx.runMutation(internal.chat.saveAIResponse, {
            chatId: args.chatId,
            content: responseText,
            model: args.model,
          });
          console.log("Successfully saved AI response to database");
        } else {
          console.log("No response text found to save");
        }
      } else {
        console.log("No stream body found");
      }
    } catch (error) {
      console.error("Error saving streamed response:", error);
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
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }
    
    return await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// Create a chat with proper user authentication
export const createUserChat = mutation({
  args: {
    prompt: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    console.log("=== CREATE USER CHAT START ===");
    console.log("Prompt:", args.prompt.substring(0, 100) + "...");
    console.log("Model:", args.model);
    console.log("User ID:", userId);
    
    const streamId = await persistentTextStreaming.createStream(ctx);
    console.log("Created stream ID:", streamId);

    // Create thread first
    const threadId = await ctx.db.insert("threads", {
      userId: userId || undefined,
      title: args.prompt.slice(0, 50) + (args.prompt.length > 50 ? "..." : ""),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });    const chatId = await ctx.db.insert("chats", {
      title: args.prompt.slice(0, 50) + (args.prompt.length > 50 ? "..." : ""),
      prompt: args.prompt,
      streamId,
      userId: userId || undefined,
      threadId: threadId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    console.log("Created chat ID:", chatId);
    console.log("Created thread ID:", threadId);    // Save user message to database
    await ctx.db.insert("messages", {
      threadId: threadId as Id<"threads">,
      userId: userId || undefined,
      content: args.prompt,
      role: "user" as const,
      createdAt: Date.now(),
    });

    // Trigger streaming via internal action
    const selectedModel = args.model || "gemini-2.5-flash";
    console.log("Triggering streaming with model:", selectedModel);
    
    await ctx.scheduler.runAfter(0, internal.chat.triggerStreaming, {
      streamId,
      prompt: args.prompt,
      model: selectedModel,
      chatId,
    });

    return { chatId, streamId };
  },
});

// Delete a chat
export const deleteChat = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or not authorized");
    }
    
    await ctx.db.delete(args.chatId);
  },
});

// Update chat title
export const updateChatTitle = mutation({
  args: { 
    chatId: v.id("chats"), 
    title: v.string() 
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or not authorized");
    }
    
    await ctx.db.patch(args.chatId, { 
      title: args.title, 
      updatedAt: Date.now() 
    });
  },
});

// Get chat messages for display (for non-agent chats)
export const getChatMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || (chat.userId && chat.userId !== userId)) {
      return null;
    }
      // For streaming chats, we'll get the stream body
    if (chat.streamId) {
      const streamBody = await persistentTextStreaming.getStreamBody(ctx, chat.streamId as any);
      return {
        chat,
        streamBody,
        messages: [
          {
            id: "user-prompt",
            text: chat.prompt || "",
            isUser: true,
            timestamp: chat.createdAt,
          },
          ...(streamBody ? [{
            id: `stream-${chat._id}`,
            text: typeof streamBody === "string" ? streamBody : (streamBody as any)?.text || (streamBody as any)?.body || "",
            isUser: false,
            timestamp: chat.createdAt + 1000,
            isStreaming: false,
          }] : [])
        ]
      };
    }
    
    return { chat, messages: [] };
  },
});

export const agentChat = action({
  args: {
    prompt: v.string(),
    model: v.optional(v.string()),
    threadId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("=== AGENT CHAT START ===");
    console.log("Prompt:", args.prompt.substring(0, 100) + "...");
    
    try {
      let threadId = args.threadId;
      let thread;

      if (threadId) {
        // Continue existing thread
        const result = await utilityAgent.continueThread(ctx, { threadId });
        thread = result.thread;
      } else {
        // Create new thread
        const result = await utilityAgent.createThread(ctx, { userId: args.userId });
        threadId = result.threadId;
        thread = result.thread;
      }

      // Generate response using the agent
      const result = await thread.generateText({ prompt: args.prompt });
      
      return {
        success: true,
        response: result.text,
        threadId,
        toolsUsed: result.toolCalls?.map(call => call.toolName) || [],
        usage: result.usage,
      };
      
    } catch (error) {
      console.error("Agent action failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Get thread messages for display in the UI - using agent framework
export const getThreadMessages = action({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    try {
      const messages = await utilityAgent.listMessages(ctx, {
        threadId: args.threadId,
        paginationOpts: { cursor: null, numItems: 50 }
      });
      
      return messages.page;
    } catch (error) {
      console.error("Error fetching thread messages:", error);
      return [];
    }
  },
});

// List all threads for a user - using component queries
export const getUserThreads = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      if (!args.userId) {
        return [];
      }
      
      // Use the agent component's built-in query for threads
      const threads = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
        userId: args.userId,
        order: "desc" as const,
        paginationOpts: { cursor: null, numItems: 20 }
      });
      
      return threads.page;
    } catch (error) {
      console.error("Error fetching user threads:", error);
      return [];
    }
  },
});

// Continue an existing chat with a new message
export const continueUserChat = mutation({
  args: {
    chatId: v.id("chats"),
    prompt: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    console.log("=== CONTINUE USER CHAT START ===");
    console.log("Chat ID:", args.chatId);
    console.log("Prompt:", args.prompt.substring(0, 100) + "...");
    console.log("Model:", args.model);
    console.log("User ID:", userId);
    
    // Verify user owns this chat
    const existingChat = await ctx.db.get(args.chatId);
    if (!existingChat || (existingChat.userId && existingChat.userId !== userId)) {
      throw new Error("Chat not found or not authorized");
    }

    // Create a new stream for the continuation
    const streamId = await persistentTextStreaming.createStream(ctx);
    console.log("Created new stream ID:", streamId);

    // Update the chat with new stream and latest prompt
    await ctx.db.patch(args.chatId, {
      streamId,
      prompt: args.prompt, // Update to latest prompt
      updatedAt: Date.now(),
    });
    
    console.log("Updated chat with new stream");    // Save user message to database if we have a thread
    if (existingChat.threadId) {
      await ctx.db.insert("messages", {
        threadId: existingChat.threadId as Id<"threads">,
        userId: userId || undefined,
        content: args.prompt,
        role: "user" as const,
        createdAt: Date.now(),
      });
    }    // Trigger streaming via internal action
    const selectedModel = args.model || "gemini-2.5-flash";
    console.log("Triggering streaming with model:", selectedModel);
    
    await ctx.scheduler.runAfter(0, internal.chat.triggerStreaming, {
      streamId,
      prompt: args.prompt,
      model: selectedModel,
      chatId: args.chatId,
    });

    return { chatId: args.chatId, streamId };
  },
});

// Save a message to the database
export const saveMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    
    // Verify user owns this chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat || (chat.userId && chat.userId !== userId)) {
      throw new Error("Chat not found or not authorized");
    }

    // Create thread if it doesn't exist
    let threadId = chat.threadId;
    if (!threadId) {
      const newThreadId = await ctx.db.insert("threads", {
        userId: userId || undefined,
        title: chat.title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      // Update chat with thread reference
      await ctx.db.patch(args.chatId, { threadId: newThreadId });
      threadId = newThreadId;
    }

    const messageId = await ctx.db.insert("messages", {
      threadId,
      userId: userId || undefined,
      content: args.content,
      role: args.role,
      metadata: args.model ? { model: args.model } : undefined,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Get messages for a chat
export const getChatMessagesFromDB = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || (chat.userId && chat.userId !== userId)) {
      return null;
    }

    if (!chat.threadId) {
      return { chat, messages: [] };
    }    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", chat.threadId as Id<"threads">))
      .order("asc")
      .collect();

    return {
      chat,
      messages: messages.map(msg => ({
        id: msg._id,
        text: msg.content,
        isUser: msg.role === "user",
        timestamp: msg.createdAt,
        model: msg.metadata?.model,
      }))
    };
  },
});

// Internal mutation to save AI response
export const saveAIResponse = internalMutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("=== SAVE AI RESPONSE ===");
    console.log("Chat ID:", args.chatId);
    console.log("Content length:", args.content.length);
    console.log("Model:", args.model);
    
    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.threadId) {
      console.error("Chat not found or no thread ID");
      return;
    }

    // Save AI response to database
    const messageId = await ctx.db.insert("messages", {
      threadId: chat.threadId as Id<"threads">,
      userId: chat.userId,
      content: args.content,
      role: "assistant" as const,
      metadata: { model: args.model },
      createdAt: Date.now(),
    });

    console.log("Saved AI response with message ID:", messageId);
    return messageId;
  },
});

// Internal query to get chat messages for streaming (includes conversation history)
export const getChatMessagesForStreaming = internalQuery({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    
    if (!chat || !chat.threadId) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", chat.threadId as Id<"threads">))
      .order("asc")
      .collect();

    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    }));
  },
});
