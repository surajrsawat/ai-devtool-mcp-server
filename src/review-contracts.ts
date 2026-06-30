import { z } from "zod";

const timestampSchema = z.string().datetime({ offset: true });

export const reviewStartInputSchema = z.object({
  repositoryId: z.string().min(1),
  branch: z.string().min(1).default("main"),
  prNumber: z.number().int().positive().optional(),
  prompt: z.string().min(1).max(4000).optional(),
});

export const reviewStatusInputSchema = z.object({
  reviewId: z.string().min(1),
});

export const reviewStatusOutputSchema = z.object({
  reviewId: z.string().min(1),
  repositoryId: z.string().min(1),
  branch: z.string().min(1),
  status: z.enum(["queued", "running", "completed", "failed"]),
  summary: z.string().nullable(),
  findings: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high", "critical"]),
      filePath: z.string().min(1),
      line: z.number().int().min(1),
      message: z.string().min(1),
    }),
  ),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type ReviewStartInput = z.infer<typeof reviewStartInputSchema>;
export type ReviewStatusInput = z.infer<typeof reviewStatusInputSchema>;
export type ReviewStatusOutput = z.infer<typeof reviewStatusOutputSchema>;