import {
  repoIndexStatusInputSchema,
  repoIndexStatusOutputSchema,
  repoSearchInputSchema,
  repoSearchOutputSchema,
} from "@ai-devtool/ai-devtool-contracts/src/index";
import { z } from "zod";
import { McpApiClient } from "./api-client";
import {
  reviewStartInputSchema,
  reviewStatusInputSchema,
  reviewStatusOutputSchema,
} from "./review-contracts";

export type ToolDefinition = {
  name: string;
  description: string;
  inputJsonSchema: Record<string, unknown>;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  handler: (input: unknown) => Promise<unknown>;
};

export const createApiBackedTools = (apiClient: McpApiClient): ToolDefinition[] => [
  {
    name: "repo_index_status",
    description: "Get repository indexing status from API backend",
    inputJsonSchema: {
      type: "object",
      required: ["repositoryId"],
      properties: {
        repositoryId: { type: "string" },
      },
      additionalProperties: false,
    },
    inputSchema: repoIndexStatusInputSchema,
    outputSchema: repoIndexStatusOutputSchema,
    handler: async (input: unknown) => {
      const parsed = repoIndexStatusInputSchema.parse(input);
      return apiClient.getIndexStatus(parsed.repositoryId);
    },
  },
  {
    name: "repo_search",
    description: "Search indexed repository content through API backend",
    inputJsonSchema: {
      type: "object",
      required: ["repositoryId", "query"],
      properties: {
        repositoryId: { type: "string" },
        query: { type: "string" },
        topK: { type: "number", minimum: 1, maximum: 50 },
      },
      additionalProperties: false,
    },
    inputSchema: repoSearchInputSchema,
    outputSchema: repoSearchOutputSchema,
    handler: async (input: unknown) => {
      const parsed = repoSearchInputSchema.parse(input);
      return apiClient.search(parsed.repositoryId, parsed.query, parsed.topK);
    },
  },
  {
    name: "review_start",
    description: "Start a code review job in API backend",
    inputJsonSchema: {
      type: "object",
      required: ["repositoryId"],
      properties: {
        repositoryId: { type: "string" },
        branch: { type: "string" },
        prNumber: { type: "number" },
        prompt: { type: "string" },
      },
      additionalProperties: false,
    },
    inputSchema: reviewStartInputSchema,
    outputSchema: reviewStatusOutputSchema,
    handler: async (input: unknown) => {
      const parsed = reviewStartInputSchema.parse(input);
      return apiClient.startReview(parsed);
    },
  },
  {
    name: "review_status",
    description: "Get code review job status from API backend",
    inputJsonSchema: {
      type: "object",
      required: ["reviewId"],
      properties: {
        reviewId: { type: "string" },
      },
      additionalProperties: false,
    },
    inputSchema: reviewStatusInputSchema,
    outputSchema: reviewStatusOutputSchema,
    handler: async (input: unknown) => {
      const parsed = reviewStatusInputSchema.parse(input);
      return apiClient.getReviewStatus(parsed.reviewId);
    },
  },
];
