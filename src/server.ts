#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "http";
import { Command } from "commander";
import { ImageGenerator } from "./services/image-generator.js";
import { createGenerateImageTool } from "./tools/generate-image.js";
import { createEditImageTool } from "./tools/edit-image.js";

/** Default HTTP server port */
const DEFAULT_PORT = 5000;

// Parse CLI arguments using commander
const program = new Command()
  .option("--transport <stdio|http>", "transport type", "stdio")
  .option("--port <number>", "port for HTTP transport", DEFAULT_PORT.toString())
  .option("--apiKey <key>", "Google API key for image generation")
  .option("--model <pro|normal>", "Fixed model to use for all operations (optional)")
  .allowUnknownOption()
  .parse(process.argv);

const cliOptions = program.opts<{
  transport: string;
  port: string;
  apiKey?: string;
  model?: "pro" | "normal";
}>();

// Validate transport option
const allowedTransports = ["stdio", "http"];
if (!allowedTransports.includes(cliOptions.transport)) {
  console.error(
    `Invalid --transport value: '${cliOptions.transport}'. Must be one of: stdio, http.`
  );
  process.exit(1);
}

// Transport configuration
const TRANSPORT_TYPE = (cliOptions.transport || "stdio") as "stdio" | "http";

// Disallow incompatible flags based on transport
const passedPortFlag = process.argv.includes("--port");

if (TRANSPORT_TYPE === "stdio" && passedPortFlag) {
  console.error("The --port flag is not allowed when using --transport stdio.");
  process.exit(1);
}

// HTTP port configuration
const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10);
  return isNaN(parsed) ? undefined : parsed;
})();

// Get API key from CLI or environment
const apiKey = cliOptions.apiKey || process.env.GOOGLE_API_KEY;

// Get fixed model from CLI if provided
const fixedModel = cliOptions.model;

// Function to create a new server instance with all tools registered
function createServerInstance() {
  const generator = new ImageGenerator(apiKey);
  const server = new McpServer({
    name: "nanobanana-mcp",
    version: "1.1.0",
  });

  // Create and register tools
  const generateImageTool = createGenerateImageTool(generator, fixedModel);
  const editImageTool = createEditImageTool(generator, fixedModel);

  server.registerTool(
    generateImageTool.name,
    {
      title: "Generate Image",
      description: generateImageTool.description,
      inputSchema: generateImageTool.inputSchema.shape,
      outputSchema: undefined,
    },
    generateImageTool.handler
  );

  server.registerTool(
    editImageTool.name,
    {
      title: "Edit Image",
      description: editImageTool.description,
      inputSchema: editImageTool.inputSchema.shape,
      outputSchema: undefined,
    },
    editImageTool.handler
  );

  return server;
}

async function main() {
  const transportType = TRANSPORT_TYPE;

  if (transportType === "http") {
    // Get initial port from environment or use default
    const initialPort = CLI_PORT ?? DEFAULT_PORT;
    let actualPort = initialPort;

    // Set up HTTP server
    const httpServer = createServer(async (req, res) => {
      const pathname = new URL(req.url || "/", "http://localhost").pathname;

      try {
        if (pathname === "/mcp" && req.method === "POST") {
          // Create new server instance for each request
          const requestServer = createServerInstance();

          // Create a new transport for each request to prevent request ID collisions
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
          });

          res.on("close", () => {
            transport.close();
            requestServer.close();
          });

          await requestServer.connect(transport);
          await transport.handleRequest(req, res);
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found", status: 404 }));
        }
      } catch (error) {
        console.error("Error handling request:", error);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal Server Error", status: 500 }));
        }
      }
    });

    // Function to attempt server listen with port fallback
    const startServer = (port: number, maxAttempts = 10) => {
      httpServer.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && port < initialPort + maxAttempts) {
          console.warn(`Port ${port} is in use, trying port ${port + 1}...`);
          startServer(port + 1, maxAttempts);
        } else {
          console.error(`Failed to start server: ${err.message}`);
          process.exit(1);
        }
      });

      httpServer.listen(port, () => {
        actualPort = port;
        console.error(
          `Nanobanana MCP Server running on ${transportType.toUpperCase()} at http://localhost:${actualPort}/mcp`
        );
      });
    };

    // Start the server with initial port
    startServer(initialPort);
  } else {
    // Stdio transport
    const server = createServerInstance();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`Nanobanana MCP Server running on stdio`);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
