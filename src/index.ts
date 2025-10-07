import "dotenv/config";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { getLatestSpeedtest } from "./tools/get_latest_speedtest.js";
import { triggerSpeedtest } from "./tools/trigger_speedtest.js";
import { getLastNResults } from "./tools/get_last_n_results.js";
import { checkLowBandwidth } from "./tools/check_low_bandwidth.js";

const server = new Server(
  { name: "speedtest-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_latest_speedtest",
      description: "Fetches the most recent Speedtest Tracker result with download speed, upload speed, ping, and server information.",
      inputSchema: { 
        type: "object", 
        properties: {}, 
        required: [] 
      }
    },
    {
      name: "trigger_speedtest",
      description: "Triggers a new speed test on demand. The test runs asynchronously and results can be retrieved after completion using get_latest_speedtest.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "get_last_n_results",
      description: "Retrieves the last N speed test results, sorted by most recent first. Useful for analyzing trends or viewing historical data.",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of results to retrieve (1-100)",
            minimum: 1,
            maximum: 100
          }
        },
        required: ["limit"]
      }
    },
    {
      name: "check_low_bandwidth",
      description: "Analyzes speed test results from the past X days to identify periods of low bandwidth. Returns statistics and timestamps when speeds were below the specified threshold percentage of the average.",
      inputSchema: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Number of days to analyze (e.g., 1, 7, 30)",
            minimum: 1,
            maximum: 90
          },
          threshold_percentage: {
            type: "number",
            description: "Percentage of average speed to consider as 'low' (default: 70, meaning below 70% of average)",
            minimum: 1,
            maximum: 100,
            default: 70
          }
        },
        required: ["days"]
      }
    }
  ]
}));

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
    
    if (request.params.name === "trigger_speedtest") {
      try {
        const result = await triggerSpeedtest();
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
    
    if (request.params.name === "get_last_n_results") {
      try {
        const limit = request.params.arguments?.limit as number;
        if (!limit) {
          throw new Error("Parameter 'limit' is required");
        }
        const result = await getLastNResults(limit);
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
    
    if (request.params.name === "check_low_bandwidth") {
      try {
        const days = request.params.arguments?.days as number;
        const thresholdPercentage = (request.params.arguments?.threshold_percentage as number) || 70;
        if (!days) {
          throw new Error("Parameter 'days' is required");
        }
        const result = await checkLowBandwidth(days, thresholdPercentage);
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
  console.error("Speedtest MCP Server running on stdio");
}

main().catch(console.error);
