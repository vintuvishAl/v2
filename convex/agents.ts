// convex/agents.ts
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { Agent, createTool } from "@convex-dev/agent";
import { z } from "zod";
import { components } from "./_generated/api";

// MCP Tool definitions
export const filesystemTool = createTool({
  description: "Read and write files using the filesystem MCP server",
  args: z.object({
    operation: z.enum(["read", "write", "list"]),
    path: z.string().describe("The file or directory path"),
    content: z.string().optional().describe("Content to write (for write operations)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    // This will make HTTP requests to the filesystem MCP server
    const mcpEndpoint = process.env.FILESYSTEM_MCP_ENDPOINT || "http://localhost:3001";
    
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      method: `filesystem.${args.operation}`,
      params: {
        path: args.path,
        ...(args.content && { content: args.content }),
      },
      id: 1,
    };

    try {
      const response = await fetch(`${mcpEndpoint}/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonRpcRequest),
      });

      const result = await response.json();
      
      if (result.error) {
        return `Error: ${result.error.message}`;
      }
      
      return JSON.stringify(result.result);
    } catch (error) {
      return `Failed to execute filesystem operation: ${error}`;
    }
  },
});

export const webSearchTool = createTool({
  description: "Search the web and fetch webpage content using the web MCP server",
  args: z.object({
    operation: z.enum(["search", "fetch"]),
    query: z.string().optional().describe("Search query (for search operations)"),
    url: z.string().optional().describe("URL to fetch (for fetch operations)"),
  }),
  handler: async (ctx, args): Promise<string> => {
    const mcpEndpoint = process.env.WEB_MCP_ENDPOINT || "http://localhost:3002";
    
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      method: `web.${args.operation}`,
      params: {
        ...(args.query && { query: args.query }),
        ...(args.url && { url: args.url }),
      },
      id: 1,
    };

    try {
      const response = await fetch(`${mcpEndpoint}/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonRpcRequest),
      });

      const result = await response.json();
      
      if (result.error) {
        return `Error: ${result.error.message}`;
      }
      
      return JSON.stringify(result.result);
    } catch (error) {
      return `Failed to execute web operation: ${error}`;
    }
  },
});

// Create different agents for different LLMs
export function createAgent(llmProvider: string = "openai") {
  let chat;
  
  switch (llmProvider) {
    case "anthropic":
      chat = anthropic("claude-3-5-sonnet-20241022");
      break;
    case "google":
    case "gemini":
      chat = google("gemini-1.5-pro-latest");
      break;
    case "openai":
    default:
      chat = openai("gpt-4o-mini");
      break;
  }

  return new Agent(components.agent, {
    chat,
    textEmbedding: openai.embedding("text-embedding-3-small"),
    instructions: `You are a helpful AI assistant with access to various tools. 
    You can help users with file operations, web searches, and general questions.
    When using tools, always explain what you're doing and provide clear results.
    Be concise but informative in your responses.`,
    tools: {
      filesystem: filesystemTool,
      webSearch: webSearchTool,
    },
    maxSteps: 5, // Allow multiple tool calls in a conversation
    maxRetries: 3,
  });
}

// Export specific agents
export const openaiAgent = createAgent("openai");
export const anthropicAgent = createAgent("anthropic");
export const geminiAgent = createAgent("gemini");
