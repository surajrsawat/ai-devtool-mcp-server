import { describe, expect, it } from "vitest";

import { createMcpToolServer } from "../src/server";

describe("mcp tool server", () => {
  it("lists both implemented tools", () => {
    const server = createMcpToolServer({
      fetcher: mockFetch,
    });

    expect(server.registry.list()).toEqual([
      "repo_index_status",
      "repo_search",
      "review_start",
      "review_status",
    ]);
  });

  it("invokes repo_index_status with contract-valid result", async () => {
    const server = createMcpToolServer({
      fetcher: mockFetch,
    });

    const result = (await server.registry.invoke("repo_index_status", {
      repositoryId: "repo_123",
    })) as { status: string; progress: number };

    expect(result.status).toBe("running");
    expect(result.progress).toBeGreaterThanOrEqual(0);
  });

  it("invokes repo_search and returns typed result", async () => {
    const server = createMcpToolServer({
      fetcher: mockFetch,
    });

    const result = (await server.registry.invoke("repo_search", {
      repositoryId: "repo_123",
      query: "retry",
    })) as { query: string; results: Array<{ path: string }> };

    expect(result.query).toBe("retry");
    expect(result.results[0].path).toBe("src/worker/index.ts");
  });

  it("rejects invalid input payload", async () => {
    const server = createMcpToolServer({
      fetcher: mockFetch,
    });

    await expect(
      server.registry.invoke("repo_search", {
        repositoryId: "repo_123",
        query: "a",
      }),
    ).rejects.toThrow();
  });

  it("starts and fetches review status through api backend", async () => {
    const server = createMcpToolServer({
      fetcher: mockFetch,
    });

    const started = (await server.registry.invoke("review_start", {
      repositoryId: "repo_123",
      branch: "main",
      prompt: "Focus on reliability",
    })) as { reviewId: string };

    const status = (await server.registry.invoke("review_status", {
      reviewId: started.reviewId,
    })) as { status: string };

    expect(status.status).toBe("completed");
  });
});

const mockFetch: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.toString();

  if (url.endsWith("/repos/repo_123/index-status")) {
    return new Response(
      JSON.stringify({
        repositoryId: "repo_123",
        status: "running",
        progress: 72,
        updatedAt: "2026-06-30T00:00:00.000Z",
      }),
      { status: 200 },
    );
  }

  if (url.endsWith("/repos/repo_123/search")) {
    return new Response(
      JSON.stringify({
        repositoryId: "repo_123",
        query: "retry",
        tookMs: 14,
        results: [
          {
            path: "src/worker/index.ts",
            line: 31,
            score: 0.91,
            snippet: "retryPolicy: { strategy: 'exponential', maxAttempts: 5 }",
          },
        ],
      }),
      { status: 200 },
    );
  }

  if (url.endsWith("/reviews") && init?.method === "POST") {
    return new Response(
      JSON.stringify({
        reviewId: "rev_123",
        repositoryId: "repo_123",
        branch: "main",
        status: "completed",
        summary: "Automated review completed",
        findings: [],
        createdAt: "2026-06-30T00:00:00.000Z",
        updatedAt: "2026-06-30T00:00:00.000Z",
      }),
      { status: 201 },
    );
  }

  if (url.endsWith("/reviews/rev_123")) {
    return new Response(
      JSON.stringify({
        reviewId: "rev_123",
        repositoryId: "repo_123",
        branch: "main",
        status: "completed",
        summary: "Automated review completed",
        findings: [],
        createdAt: "2026-06-30T00:00:00.000Z",
        updatedAt: "2026-06-30T00:00:00.000Z",
      }),
      { status: 200 },
    );
  }

  return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
};
