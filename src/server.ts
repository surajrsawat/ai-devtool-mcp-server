import { ToolRegistry } from "./registry";
import { repoIndexStatusTool, repoSearchTool } from "./tools";

export const createMcpToolServer = (): ToolRegistry => {
  const registry = new ToolRegistry();

  registry.register("repo_index_status", repoIndexStatusTool);
  registry.register("repo_search", repoSearchTool);

  return registry;
};
