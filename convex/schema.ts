import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
  }),  // Chat configurations for persistent streaming
  chats: defineTable({
    title: v.string(),
    prompt: v.optional(v.string()), // Optional for backwards compatibility
    streamId: v.optional(v.string()), // Links to persistent streaming component
    createdAt: v.number(),
    // Legacy fields for backwards compatibility
    userId: v.optional(v.string()),
    threadId: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_thread", ["threadId"]),
});
