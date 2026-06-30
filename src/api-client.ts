import {
  repoIndexStatusOutputSchema,
  repoSearchOutputSchema,
  type RepoIndexStatusOutput,
  type RepoSearchOutput,
} from "@ai-devtool/ai-devtool-contracts/src/index";
import {
  reviewStartInputSchema,
  reviewStatusOutputSchema,
  type ReviewStartInput,
  type ReviewStatusOutput,
} from "./review-contracts";

type FetchLike = typeof fetch;

export class McpApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async getIndexStatus(repositoryId: string): Promise<RepoIndexStatusOutput> {
    const data = await this.request(`/repos/${encodeURIComponent(repositoryId)}/index-status`);
    return repoIndexStatusOutputSchema.parse(data);
  }

  async search(repositoryId: string, query: string, topK: number): Promise<RepoSearchOutput> {
    const data = await this.request(`/repos/${encodeURIComponent(repositoryId)}/search`, {
      method: "POST",
      body: JSON.stringify({ query, topK }),
    });

    return repoSearchOutputSchema.parse(data);
  }

  async startReview(input: ReviewStartInput): Promise<ReviewStatusOutput> {
    const payload = reviewStartInputSchema.parse(input);
    const data = await this.request("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return reviewStatusOutputSchema.parse(data);
  }

  async getReviewStatus(reviewId: string): Promise<ReviewStatusOutput> {
    const data = await this.request(`/reviews/${encodeURIComponent(reviewId)}`);

    return reviewStatusOutputSchema.parse(data);
  }

  private async request(path: string, init?: RequestInit): Promise<unknown> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`API request failed (${response.status}): ${bodyText}`);
    }

    return response.json();
  }
}