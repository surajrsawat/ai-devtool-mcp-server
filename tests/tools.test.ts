import { describe, expect, it } from "vitest";

import { createMcpToolServer } from "../src/server";

describe("mcp tool server", () => {
  it("lists both implemented tools", () => {
    const server = createMcpToolServer();

    expect(server.list()).toEqual(["repo_index_status", "repo_search"]);
  });

  it("invokes repo_index_status with contract-valid result", async () => {
    const server = createMcpToolServer();

    const result = (await server.invoke("repo_index_status", {
      repositoryId: "repo_123",
    })) as { status: string; progress: number };

    expect(result.status).toBe("running");
    expect(result.progress).toBeGreaterThanOrEqual(0);
  });

  it("invokes repo_search and returns typed result", async () => {
    const server = createMcpToolServer();

    const result = (await server.invoke("repo_search", {
      repositoryId: "repo_123",
      query: "retry",
    })) as { query: string; results: Array<{ path: string }> };

    expect(result.query).toBe("retry");
    expect(result.results[0].path).toBe("src/index.ts");
  });

  it("rejects invalid input payload", async () => {
    const server = createMcpToolServer();

    await expect(
      server.invoke("repo_search", {
        repositoryId: "repo_123",
        query: "a",
      }),
    ).rejects.toThrow();
  });
});
