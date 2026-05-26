import { beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubRepositoryError } from "../../../lib/github";

vi.mock("../../../lib/github", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/github")>("../../../lib/github");

  return {
    ...actual,
    fetchGitHubRepository: vi.fn()
  };
});

import { fetchGitHubRepository } from "../../../lib/github";
import { POST } from "./route";

const repositoryResponse = {
  repository: {
    owner: "vyshn",
    repo: "career-os",
    fullName: "vyshn/career-os",
    url: "https://github.com/vyshn/career-os",
    description: "AI portfolio builder",
    homepage: null,
    stars: 1,
    forks: 0,
    watchers: 1,
    openIssues: 0,
    defaultBranch: "main",
    language: "TypeScript",
    topics: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    readme: "# CareerOS",
    detectedTech: ["TypeScript"],
    projectSummary: "AI portfolio builder"
  }
};

describe("POST /api/github-repo", () => {
  beforeEach(() => {
    vi.mocked(fetchGitHubRepository).mockReset();
  });

  it("returns normalized repository data for a valid request", async () => {
    vi.mocked(fetchGitHubRepository).mockResolvedValueOnce(repositoryResponse);

    const response = await POST(
      new Request("http://localhost/api/github-repo", {
        method: "POST",
        body: JSON.stringify({ url: "https://github.com/vyshn/career-os" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(repositoryResponse);
    expect(fetchGitHubRepository).toHaveBeenCalledWith("https://github.com/vyshn/career-os");
  });

  it("returns 400 when url is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/github-repo", {
        method: "POST",
        body: JSON.stringify({})
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("GitHub repository URL is required.");
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/github-repo", {
        method: "POST",
        body: "{"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Request body must be valid JSON.");
  });

  it("returns GitHub repository errors with their status code", async () => {
    vi.mocked(fetchGitHubRepository).mockRejectedValueOnce(
      new GitHubRepositoryError("GitHub repository was not found or is not public.", 404)
    );

    const response = await POST(
      new Request("http://localhost/api/github-repo", {
        method: "POST",
        body: JSON.stringify({ url: "https://github.com/vyshn/missing" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("GitHub repository was not found or is not public.");
  });

  it("returns 500 for unexpected errors", async () => {
    vi.mocked(fetchGitHubRepository).mockRejectedValueOnce(new Error("boom"));

    const response = await POST(
      new Request("http://localhost/api/github-repo", {
        method: "POST",
        body: JSON.stringify({ url: "https://github.com/vyshn/career-os" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("GitHub repository analysis failed. Please try again.");
  });
});
