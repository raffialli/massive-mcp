# 🧠 Massive MCP Server — Speedtest Tracker Integration

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![Claude MCP](https://img.shields.io/badge/Claude-Compatible-purple.svg)
![Platform](https://img.shields.io/badge/Platform-Cross--Platform-lightgrey.svg)

This project is a working example of a **custom MCP (Model Context Protocol) server** written in TypeScript.  
It connects Claude (or any other MCP-aware client) to a local service — in this case, a [Speedtest Tracker](https://github.com/henrywhitaker3/Speedtest-Tracker) instance — enabling intelligent analysis of network performance, historical trends, and on-demand speed testing.

While this project uses Speedtest Tracker as the demo integration, its main purpose is to help you understand **how to build, structure, and run an MCP server**.

---

## 🚀 What an MCP Server Does

An MCP (Model Context Protocol) server exposes tools or data sources that a language model (like Claude) can call at runtime.  
Each MCP server defines:
- **Capabilities** (what it can do)
- **Tools** (actions Claude can trigger)
- **Schemas** (what the input/output looks like)

This server defines **four powerful tools** for comprehensive speed test management:

### 📊 Available Tools

1. **`get_latest_speedtest`**  
   Retrieves the most recent speed test result with download/upload speeds, ping, server info, and timestamp.

2. **`trigger_speedtest`**  
   Initiates a new speed test on demand. The test runs asynchronously and results can be retrieved after completion.

3. **`get_last_n_results`**  
   Retrieves the last N speed test results (1-100) for trend analysis and historical review.

4. **`check_low_bandwidth`**  
   Analyzes speed test results over a customizable time period (1-90 days) to identify when bandwidth was below a specified threshold percentage of average speeds.

---

## 🧩 Project Structure

```
speedtest-mcp-server/
├── src/
│   ├── index.ts                      # Main MCP server entry point
│   └── tools/
│       ├── get_latest_speedtest.ts   # Get latest test result
│       ├── trigger_speedtest.ts      # Trigger new test
│       ├── get_last_n_results.ts     # Get historical results
│       └── check_low_bandwidth.ts    # Analyze bandwidth trends
├── dist/                             # Compiled JavaScript (after build - local)
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Requirements

- **Node.js 20+**
- **TypeScript 5+**
- **Claude Desktop** (or another MCP-compatible client)
- A running **Speedtest Tracker** instance with API access enabled (optional for testing)

---

## 📦 Setup Instructions

### 1️⃣ Clone and install dependencies
```bash
git clone https://github.com/<your-username>/speedtest-mcp-server.git
cd speedtest-mcp-server
npm install
```

---


**🚀 Env variables**

To connect to your actual Speedtest Tracker API, configure these environment variables:

```
SPEEDTEST_BASE_URL=https://<your-speedtest-domain>/api/v1
SPEEDTEST_TOKEN=<your_speedtest_token_here>
```

The server automatically detects when credentials are available and switches from mock to live mode.

---

### 3️⃣ Build or run in development mode

- To start in dev mode (live TypeScript with `tsx`):
  ```bash
  npm run dev
  ```

- To compile for production:
  ```bash
  npm run build
  npm start
  ```

You should see:
```
Speedtest MCP Server running on stdio
```

---

### 4️⃣ Configure Claude Desktop

Add the following section to your local Claude MCP configuration file:

**Windows:**
```
C:\Users\<YOUR_USERNAME>\AppData\Roaming\Claude\claude_desktop_config.json
```

**macOS/Linux:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```


**Example entry**:

```json
{
  "mcpServers": {
    "speedtest-mcp": {
      "command": "node",
      "args": ["<path_to_project>/dist/index.js"],
      "env": {
        "SPEEDTEST_BASE_URL": "https://speedtest.example.com/api/v1",
        "SPEEDTEST_TOKEN": "your_token_here",
      }
    }
  }
}
```

> ⚠️ **Important:**  
> Claude only sees environment variables you list under `"env"`.  
> It does **not** automatically read `.env` files.

---

### 5️⃣ Test with Claude

Restart Claude Desktop.  
Then, in a new chat, try these example prompts:

> "Show me the latest speed test results."

> "Run a new speed test for me."

> "Get the last 10 speed test results."

> "Check if my bandwidth was low in the past 7 days."

Claude will call the appropriate tools and return formatted results!

---

## 🧠 How It Works

- The server uses the [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) to handle JSON-RPC over stdio.  
- `index.ts` defines all MCP tools with input schemas and starts the stdio transport.  
- Each tool module (`src/tools/*.ts`) handles its own logic, API calls, and mock data.
- **Production mode** uses `node-fetch` to communicate with the Speedtest Tracker API.
- All outputs are formatted as clean JSON that Claude can interpret and present to users.

---

## 🧰 Extending the Server

You can easily add more tools:
1. Create a new file under `src/tools/` (e.g., `get_server_list.ts`).
2. Import it in `src/index.ts`.
3. Add it to the `tools` list in `ListToolsRequestSchema` handler with its schema and description.
4. Add a handler in `CallToolRequestSchema` to execute the tool.

Each new tool instantly becomes available to Claude through your MCP.

---

## 🧱 Example Outputs

### `get_latest_speedtest`
```json
{
  "id": 12345,
  "timestamp": "2025-10-07T15:22:17Z",
  "ping": 7,
  "download": "918.34 Mbps",
  "upload": "838.21 Mbps",
  "server": "AT&T Fiber",
  "isp": "AT&T",
  "location": "Orlando, FL"
}
```

### `trigger_speedtest`
```json
{
  "success": true,
  "message": "Speed test initiated successfully",
  "test_id": 12346,
  "status": "queued",
  "estimated_duration": "30-60 seconds"
}
```

### `get_last_n_results`
```json
{
  "count": 5,
  "results": [
    {
      "id": 12345,
      "timestamp": "2025-10-07T15:22:17Z",
      "ping": 7,
      "download": "918.34 Mbps",
      "upload": "838.21 Mbps",
      "server": "AT&T Fiber",
      "isp": "AT&T",
      "location": "Orlando, FL"
    }
  ]
}
```

### `check_low_bandwidth`
```json
{
  "period": {
    "days": 7,
    "start_date": "2025-10-01T00:00:00Z",
    "end_date": "2025-10-07T15:30:00Z"
  },
  "statistics": {
    "total_tests": 56,
    "average_download_mbps": 905.32,
    "average_upload_mbps": 847.18,
    "min_download_mbps": 720.45,
    "max_download_mbps": 985.12
  },
  "low_bandwidth_events": [
    {
      "id": 12340,
      "timestamp": "2025-10-05T08:15:00Z",
      "download_mbps": 625.34,
      "upload_mbps": 580.21,
      "percentage_of_average_download": 69,
      "percentage_of_average_upload": 68,
      "duration_from_now": "2 days ago"
    }
  ],
  "summary": "Found 3 low bandwidth events out of 56 tests (5%) over the past 7 days. Average speeds: 905.32 Mbps down / 847.18 Mbps up."
}
```

---

## 🧩 Why This Matters

This Speedtest MCP server demonstrates how to build a **production-ready integration** with:
- Multiple complementary tools for comprehensive analysis
- Statistical analysis and trend detection
- Clean, human-readable output formatting

Once you grasp this pattern, you can expose any API or local script as Claude tools for your homelab systems (Pi-hole, Synology, Home Assistant, etc.).

---

## 🪄 Next Steps

- **Add more analytical tools**: Compare speeds across different times of day, detect anomalies, etc.
- **Create new integrations**: Build MCP servers for Pi-hole stats, Synology backup status, etc.
- **Enhance error handling**: Add retry logic, rate limiting, or webhook notifications.
- **Explore multiple servers**: Combine this with other MCP servers under one Claude profile.

---

## 🧾 Credits

Built by Raffi as part of a homelab MCP exploration project.
