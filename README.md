# 🧠 Massive MCP Server — Example for Speedtest Tracker Integration

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![Claude MCP](https://img.shields.io/badge/Claude-Compatible-purple.svg)
![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey.svg)

This project is a working example of a **custom MCP (Model Context Protocol) server** written in TypeScript.  
It connects Claude (or any other MCP-aware client) to a local service — in this case, a [Speedtest Tracker](https://github.com/henrywhitaker3/Speedtest-Tracker) instance — and returns the latest network speed results.

While this project uses Speedtest Tracker as the demo integration, its main purpose is to help you understand **how to build, structure, and run an MCP server**.

---

## 🚀 What an MCP Server Does

An MCP (Model Context Protocol) server exposes tools or data sources that a language model (like Claude) can call at runtime.  
Each MCP server defines:
- **Capabilities** (what it can do)
- **Tools** (actions Claude can trigger)
- **Schemas** (what the input/output looks like)

In this example, the server defines a single tool:
```
get_latest_speedtest
```
which returns the most recent download/upload speeds, ping, and timestamp from your Speedtest Tracker API.

---

## 🧩 Project Structure

```
massive-mcp/
├── src/
│   ├── index.ts               # Main MCP server entry point
│   └── tools/
│       └── get_latest_speedtest.ts
├── .env                       # Local environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Requirements

- **Node.js 20+**
- **TypeScript 5+**
- **Claude Desktop** (or another MCP-compatible client)
- A running **Speedtest Tracker** instance with API access enabled

---

## 📦 Setup Instructions

### 1️⃣ Clone and install dependencies
```bash
git clone https://github.com/<your-username>/massive-mcp.git
cd massive-mcp
npm install
```

---

### 2️⃣ Configure environment variables

Create a `.env` file in the project root:

```
SPEEDTEST_TOKEN=<your_speedtest_token_here>
API_URL=https://<your-speedtest-domain>/api/v1/results/latest
```

This file is used when running locally via `npm run dev`.

> **Note:** Claude Desktop does not automatically load `.env` files.  
> When using this MCP with Claude, you’ll define these variables inside your Claude configuration (see below).

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
MCP Server running on stdio
```

---

### 4️⃣ Configure Claude Desktop

Add the following section to your local Claude MCP configuration file:

**Windows:**
```
C:\Users\<YOUR_USERNAME>\AppData\Roaming\Claude\mcp_servers.json
```

**macOS/Linux:**
```
~/.config/Claude/mcp_servers.json
```

Example entry:

```json
"myhome-mcp": {
  "command": "<path_to_project>\\node_modules\\.bin\\tsx.cmd",
  "args": ["<path_to_project>\\src\\index.ts"],
  "env": {
    "SPEEDTEST_TOKEN": "<your_speedtest_token_here>",
    "API_URL": "<your_speedtest_api_url_here>"
  }
}
```

> ⚠️ **Important:**  
> Claude only sees environment variables you list under `"env"`.  
> It does **not** automatically read `.env` files.

---

### 5️⃣ Test with Claude

Restart Claude Desktop.  
Then, in a new chat, ask something like:

> “Show me the latest speed test results.”

Claude will call your `get_latest_speedtest` tool, which queries your Speedtest Tracker API and returns the latest results.

---

## 🧠 How It Works

- The server uses the [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) to handle JSON-RPC over stdio.  
- `index.ts` defines the MCP tools and starts the stdio transport.  
- `get_latest_speedtest.ts` performs a `fetch()` call against the Speedtest Tracker API using your provided token and URL.
- The output is formatted as JSON text that Claude can render directly in chat.

---

## 🧰 Extending the Server

You can easily add more tools:
1. Create a new file under `src/tools/` (e.g., `get_synology_status.ts`).
2. Import it in `src/index.ts`.
3. Add it to the `tools` list with its schema and description.

Each new tool instantly becomes available to Claude through your MCP.

---

## 🧱 Example Output

When you trigger the tool, Claude will receive data like:

```json
{
  "id": 12345,
  "timestamp": "2025-10-05T15:22:17Z",
  "ping": 7,
  "download": "918.34 Mbps",
  "upload": "838.21 Mbps",
  "server": "AT&T Fiber",
  "isp": "AT&T",
  "location": "Orlando, FL"
}
```

---

## 🧩 Why This Matters

This Speedtest example is intentionally simple — it’s meant to teach you **how to build and connect your own MCP servers** to local services, APIs, or homelab systems (like Pi-hole, Synology, or Home Assistant).  

Once you grasp this pattern, you can expose any API or local script as a Claude tool.

---

## 🪄 Next Steps

- Add authentication or logging middleware.  
- Create new tools for your homelab (Pi-hole stats, Synology backup status, etc.).  
- Explore how multiple MCP servers can be combined under one Claude profile.

---

## 🧾 Credits

Built by Raffi as part of a homelab MCP exploration project.
