import {
  repoIndexStatusInputSchema,
  repoIndexStatusOutputSchema,
  repoSearchInputSchema,
  repoSearchOutputSchema,
} from "@ai-devtool/ai-devtool-contracts/src/index";

const now = (): string => new Date().toISOString();

export const repoIndexStatusTool = {
  inputSchema: repoIndexStatusInputSchema,
  outputSchema: repoIndexStatusOutputSchema,
  handler: async (input: { repositoryId: string }) => ({
    repositoryId: input.repositoryId,
    status: "running" as const,
    progress: 65,
    updatedAt: now(),
  }),
};

export const repoSearchTool = {
  inputSchema: repoSearchInputSchema,
  outputSchema: repoSearchOutputSchema,
  handler: async (input: { repositoryId: string; query: string; topK: number }) => ({
    repositoryId: input.repositoryId,
    query: input.query,
    tookMs: 12,
    results: [
      {
        path: "src/index.ts",
        line: 14,
        score: 0.9,
        snippet: `Mock result for query: ${input.query} (topK=${input.topK})`,
      },
    ],
  }),
};
