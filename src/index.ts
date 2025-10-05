// src/index.ts
import "dotenv/config";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server";   // ← instead of require()
import { getLatestSpeedtest } from "./tools/get_latest_speedtest.js";

const server = new Server(
  { name: "myhome-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_latest_speedtest",
      description:
        "Fetches the most recent Speedtest Tracker result and returns download/upload speeds, ping, and timestamp.",
      inputSchema: { type: "object", properties: {}, required: [] }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    if (request.params.name === "get_latest_speedtest") {
      try {
        const result = await getLatestSpeedtest();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch(console.error);
