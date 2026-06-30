import { ToolRegistry } from "./registry";
import { McpApiClient } from "./api-client";
import { createApiBackedTools, type ToolDefinition } from "./tools";

export type McpToolDescriptor = {
  name: string;
  description: string;
  inputJsonSchema: Record<string, unknown>;
};

export type McpToolServer = {
  registry: ToolRegistry;
  tools: McpToolDescriptor[];
};

export const createMcpToolServer = (options?: {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
}): McpToolServer => {
  const registry = new ToolRegistry();
  const apiBaseUrl = options?.apiBaseUrl ?? process.env.API_BASE_URL ?? "http://localhost:3001";
  const apiClient = new McpApiClient(apiBaseUrl, options?.fetcher);
  const tools = createApiBackedTools(apiClient);

  for (const tool of tools) {
    registry.register(tool.name, {
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
      handler: tool.handler,
    });
  }

  return {
    registry,
    tools: tools.map((tool: ToolDefinition) => ({
      name: tool.name,
      description: tool.description,
      inputJsonSchema: tool.inputJsonSchema,
    })),
  };
};
