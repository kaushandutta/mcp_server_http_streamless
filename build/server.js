import express from 'express';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { MCPServer } from './mcpServer.js';
const app = express();
const port = process.env.PORT || 3000;
const SESSION_ID_HEADER_NAME = "mcp-session-id";
app.use(express.json());
// Initialize the MCP server once
const mcpServer = MCPServer.initialize();
// Store transports by session ID
const transports = new Map();
app.post("/mcp", async (req, res) => {
    let sessionId = req.headers[SESSION_ID_HEADER_NAME.toLowerCase()];
    console.log(`POST /mcp - Session ID: ${sessionId}`);
    console.log(`Request body:`, JSON.stringify(req.body, null, 2));
    try {
        let transport = sessionId ? transports.get(sessionId) : undefined;
        if (!transport) {
            // Generate session ID upfront
            const newSessionId = randomUUID();
            console.log(`Creating new transport and session: ${newSessionId}`);
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => newSessionId,
            });
            // Connect the MCP server to the transport
            await mcpServer.connect(transport);
            // Store the transport with the known session ID
            transports.set(newSessionId, transport);
            res.setHeader(SESSION_ID_HEADER_NAME, newSessionId);
            sessionId = newSessionId;
            console.log(`Created new session: ${newSessionId}`);
        }
        else {
            console.log(`Reusing existing transport for session ${sessionId}`);
        }
        // Handle the request
        console.log(`📨 Handling ${req.body.method} request for session ${sessionId}`);
        await transport.handleRequest(req, res, req.body);
        console.log(`✅ ${req.body.method} request handled successfully for session ${sessionId}`);
    }
    catch (error) {
        console.error("Error handling POST request:", error);
        if (!res.headersSent) {
            res.status(500).json({
                error: "Internal Server Error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
});
app.listen(port, () => {
    console.log(`MCP Server is running on http://localhost:${port}`);
});
