// convex/userPreferences.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user preferences
export const getUserPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return prefs || {
      userId: args.userId,
      selectedLLM: "openai",
      enabledTools: ["filesystem", "webSearch"],
      mcpServerConfigs: {
        filesystem: { enabled: true, endpoint: "http://localhost:3001" },
        web: { enabled: true, endpoint: "http://localhost:3002" },
        database: { enabled: false, endpoint: "http://localhost:3003" },
      },
    };
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    selectedLLM: v.optional(v.string()),
    enabledTools: v.optional(v.array(v.string())),
    mcpServerConfigs: v.optional(v.object({
      filesystem: v.optional(v.object({ enabled: v.boolean(), endpoint: v.string() })),
      web: v.optional(v.object({ enabled: v.boolean(), endpoint: v.string() })),
      database: v.optional(v.object({ enabled: v.boolean(), endpoint: v.string() })),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const updates = {
      ...(args.selectedLLM && { selectedLLM: args.selectedLLM }),
      ...(args.enabledTools && { enabledTools: args.enabledTools }),
      ...(args.mcpServerConfigs && { mcpServerConfigs: args.mcpServerConfigs }),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("userPreferences", {
        userId: args.userId,
        selectedLLM: args.selectedLLM || "openai",
        enabledTools: args.enabledTools || ["filesystem", "webSearch"],
        mcpServerConfigs: args.mcpServerConfigs || {
          filesystem: { enabled: true, endpoint: "http://localhost:3001" },
          web: { enabled: true, endpoint: "http://localhost:3002" },
          database: { enabled: false, endpoint: "http://localhost:3003" },
        },
      });
    }
  },
});

// Get available MCP servers
export const getMcpServers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mcpServers").collect();
  },
});

// Add/update MCP server configuration
export const updateMcpServer = mutation({
  args: {
    name: v.string(),
    endpoint: v.string(),
    isEnabled: v.boolean(),
    description: v.string(),
    toolsAvailable: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mcpServers")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        endpoint: args.endpoint,
        isEnabled: args.isEnabled,
        description: args.description,
        toolsAvailable: args.toolsAvailable,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("mcpServers", args);
    }
  },
});
