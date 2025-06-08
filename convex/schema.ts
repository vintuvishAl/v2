import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Include authentication tables
  ...authTables,
  
  // User preferences for LLM selection and tool configuration
  userPreferences: defineTable({
    userId: v.string(),
    selectedLLM: v.string(),
    enabledTools: v.array(v.string()),
    mcpServerConfigs: v.optional(v.object({
      filesystem: v.optional(v.object({ enabled: v.boolean(), endpoint: v.string() })),
      web: v.optional(v.object({ enabled: v.boolean(), endpoint: v.string() })),
      database: v.optional(v.object({ enabled: v.boolean(), endpoint: v.string() })),
    })),
  }).index("by_user", ["userId"]),
  
  // MCP Server configurations
  mcpServers: defineTable({
    name: v.string(),
    endpoint: v.string(),
    isEnabled: v.boolean(),
    description: v.string(),
    toolsAvailable: v.array(v.string()),
  }),
  // Chat configurations for persistent streaming
  chats: defineTable({
    title: v.string(),
    prompt: v.optional(v.string()), // Optional for backwards compatibility
    streamId: v.optional(v.string()), // Links to persistent streaming component
    createdAt: v.number(),
    // User information - now linked to auth
    userId: v.optional(v.id("users")), // Reference to authenticated user
    threadId: v.optional(v.id("threads")), // Changed to proper ID reference
    updatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_thread", ["threadId"]),

  // User profiles linked to authentication
  profiles: defineTable({
    userId: v.id("users"), // Reference to auth user
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      defaultModel: v.optional(v.string()),
      useAgent: v.optional(v.boolean()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Chat threads for agent conversations
  threads: defineTable({
    userId: v.optional(v.id("users")),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    status: v.optional(v.string()),
    agentThreadId: v.optional(v.string()), // Links to agent framework thread
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_agent_thread", ["agentThreadId"]),
  // Messages for chat display
  messages: defineTable({
    threadId: v.id("threads"),
    userId: v.optional(v.id("users")),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    agentMessageId: v.optional(v.string()), // Links to agent framework message
    toolCalls: v.optional(v.array(v.object({
      toolName: v.string(),
      args: v.any(),
      result: v.optional(v.any()),
    }))),
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      usage: v.optional(v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
      })),
    })),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"])
    .index("by_user", ["userId"]),
});
