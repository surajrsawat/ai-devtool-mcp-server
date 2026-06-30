import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createMcpToolServer } from "./server";

export const startStdioServer = async (): Promise<void> => {
  const runtime = createMcpToolServer();

  const server = new Server(
    {
      name: "ai-devtool-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: runtime.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputJsonSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await runtime.registry.invoke(request.params.name, request.params.arguments ?? {});

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

if (process.argv[1]?.endsWith("stdio.ts")) {
  void startStdioServer();
}
