import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const API_PORT = Number.parseInt(process.env.API_PORT ?? "3001", 10);
const API_BASE_URL = process.env.API_BASE_URL ?? `http://127.0.0.1:${API_PORT}`;

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const projectRoot = resolve(process.cwd(), "..");
const apiRepoPath = resolve(projectRoot, "ai-devtool-api");
const mcpRepoPath = process.cwd();

const asTextResult = (result: unknown): unknown => {
  if (!result || typeof result !== "object") {
    return result;
  }

  const content = (result as { content?: unknown }).content;
  if (!Array.isArray(content) || content.length === 0) {
    return result;
  }

  const textBlock = content.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      (item as { type?: unknown }).type === "text" &&
      typeof (item as { text?: unknown }).text === "string",
  ) as { text: string } | undefined;

  if (!textBlock) {
    return result;
  }

  try {
    return JSON.parse(textBlock.text);
  } catch {
    return textBlock.text;
  }
};

const startApiServer = (): ChildProcess => {
  const child = spawn(npmCommand, ["run", "start:dev"], {
    cwd: apiRepoPath,
    env: {
      ...process.env,
      PORT: String(API_PORT),
    },
    stdio: "inherit",
  });

  return child;
};

const waitForApi = async (): Promise<void> => {
  const retries = 30;

  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Ignore transient startup failures.
    }

    await wait(500);
  }

  throw new Error(`API did not become healthy at ${API_BASE_URL}/health`);
};

const run = async (): Promise<void> => {
  console.log(`[e2e] starting API at ${API_BASE_URL}`);
  const apiProcess = startApiServer();

  let transport: StdioClientTransport | undefined;
  let client: Client | undefined;

  try {
    await waitForApi();
    console.log("[e2e] API is healthy");

    transport = new StdioClientTransport({
      command: npmCommand,
      args: ["run", "start:stdio"],
      cwd: mcpRepoPath,
      env: {
        ...process.env,
        API_BASE_URL,
      },
      stderr: "inherit",
    });

    client = new Client({
      name: "ai-devtool-local-e2e",
      version: "0.1.0",
    });

    await client.connect(transport);
    console.log("[e2e] MCP stdio connected");

    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name).sort();
    console.log(`[e2e] tools: ${names.join(", ")}`);

    const required = ["repo_index_status", "repo_search", "review_start", "review_status"];
    for (const tool of required) {
      if (!names.includes(tool)) {
        throw new Error(`Missing expected tool: ${tool}`);
      }
    }

    const indexStatus = asTextResult(
      await client.callTool({
        name: "repo_index_status",
        arguments: { repositoryId: "repo_123" },
      }),
    );
    console.log(`[e2e] repo_index_status => ${JSON.stringify(indexStatus)}`);

    const searchResult = asTextResult(
      await client.callTool({
        name: "repo_search",
        arguments: { repositoryId: "repo_123", query: "retry", topK: 3 },
      }),
    );
    console.log(`[e2e] repo_search => ${JSON.stringify(searchResult)}`);

    const reviewStart = asTextResult(
      await client.callTool({
        name: "review_start",
        arguments: {
          repositoryId: "repo_123",
          branch: "main",
          prompt: "Focus on reliability and security",
        },
      }),
    ) as { reviewId?: unknown };

    if (!reviewStart || typeof reviewStart.reviewId !== "string") {
      throw new Error("review_start did not return a reviewId");
    }

    console.log(`[e2e] review_start => ${JSON.stringify(reviewStart)}`);

    const reviewStatus = asTextResult(
      await client.callTool({
        name: "review_status",
        arguments: { reviewId: reviewStart.reviewId },
      }),
    );
    console.log(`[e2e] review_status => ${JSON.stringify(reviewStatus)}`);

    console.log("[e2e] success");
  } finally {
    if (client) {
      await client.close();
    }
    if (transport) {
      await transport.close();
    }

    if (apiProcess.pid && !apiProcess.killed) {
      apiProcess.kill("SIGTERM");
      await wait(400);
      if (!apiProcess.killed) {
        apiProcess.kill("SIGKILL");
      }
    }
  }
};

void run().catch((error) => {
  console.error("[e2e] failed", error);
  process.exit(1);
});
