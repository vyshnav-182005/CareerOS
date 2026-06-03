import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchGitHubRepository,
  fetchGitHubUserProjects,
  GitHubRepositoryError,
  parseGitHubRepoUrl
} from "./github";

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers }
  });
}

describe("parseGitHubRepoUrl", () => {
  it("parses a normal GitHub repository URL", () => {
    expect(parseGitHubRepoUrl("https://github.com/openai/codex")).toEqual({
      owner: "openai",
      repo: "codex"
    });
  });

  it("rejects invalid GitHub repository URLs", () => {
    expect(() => parseGitHubRepoUrl("https://example.com/openai/codex")).toThrow(
      new GitHubRepositoryError("Enter a valid GitHub repository URL.", 400)
    );
    expect(() => parseGitHubRepoUrl("https://github.com/openai")).toThrow(
      new GitHubRepositoryError("Enter a valid GitHub repository URL.", 400)
    );
    expect(() => parseGitHubRepoUrl("not a url")).toThrow(
      new GitHubRepositoryError("Enter a valid GitHub repository URL.", 400)
    );
  });
});

describe("fetchGitHubRepository", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns normalized repository data with a decoded README", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          name: "career-os",
          full_name: "vyshn/career-os",
          html_url: "https://github.com/vyshn/career-os",
          description: "AI portfolio builder with Next.js",
          homepage: "https://careeros.example",
          stargazers_count: 42,
          forks_count: 3,
          watchers_count: 42,
          open_issues_count: 1,
          default_branch: "main",
          language: "TypeScript",
          topics: ["nextjs", "tailwindcss"],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-05-01T00:00:00Z"
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          content: Buffer.from("# CareerOS\nBuilt with React and Next.js").toString("base64"),
          encoding: "base64"
        })
      );

    const result = await fetchGitHubRepository("https://github.com/vyshn/career-os");

    expect(result.repository).toMatchObject({
      owner: "vyshn",
      repo: "career-os",
      fullName: "vyshn/career-os",
      url: "https://github.com/vyshn/career-os",
      description: "AI portfolio builder with Next.js",
      homepage: "https://careeros.example",
      stars: 42,
      forks: 3,
      watchers: 42,
      openIssues: 1,
      defaultBranch: "main",
      language: "TypeScript",
      topics: ["nextjs", "tailwindcss"],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-05-01T00:00:00Z",
      readme: "# CareerOS\nBuilt with React and Next.js",
      projectSummary: "AI portfolio builder with Next.js"
    });
    expect(result.repository.detectedTech).toEqual(
      expect.arrayContaining(["TypeScript", "Next.js", "React", "Tailwind CSS"])
    );
  });

  it("succeeds when the repository has no README", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          name: "empty",
          full_name: "vyshn/empty",
          html_url: "https://github.com/vyshn/empty",
          description: null,
          homepage: null,
          stargazers_count: 0,
          forks_count: 0,
          watchers_count: 0,
          open_issues_count: 0,
          default_branch: "main",
          language: null,
          topics: [],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-05-01T00:00:00Z"
        })
      )
      .mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404));

    const result = await fetchGitHubRepository("https://github.com/vyshn/empty");

    expect(result.repository.readme).toBe("");
    expect(result.repository.projectSummary).toBe("No repository description available.");
  });

  it("maps missing repositories to a stable not found error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404));

    await expect(fetchGitHubRepository("https://github.com/vyshn/missing")).rejects.toMatchObject({
      message: "GitHub repository was not found or is not public.",
      status: 404
    });
  });

  it("maps GitHub rate limits to a stable rate limit error", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      jsonResponse({ message: "API rate limit exceeded" }, 403, {
        "x-ratelimit-remaining": "0"
      })
    );

    await expect(fetchGitHubRepository("https://github.com/vyshn/limited")).rejects.toMatchObject({
      message: "GitHub API rate limit exceeded. Please try again later.",
      status: 429
    });
  });
});

describe("fetchGitHubUserProjects", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns public profile repositories with detected tech stack from metadata", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        jsonResponse([
          {
            name: "career-os",
            full_name: "vyshn/career-os",
            html_url: "https://github.com/vyshn/career-os",
            description: "AI profile builder with React, Next.js, and Supabase",
            homepage: null,
            stargazers_count: 12,
            forks_count: 1,
            watchers_count: 12,
            open_issues_count: 0,
            default_branch: "main",
            language: "TypeScript",
            topics: ["nextjs", "tailwindcss", "ats"],
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-05-01T00:00:00Z"
          }
        ])
      )
      .mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404))
      .mockResolvedValueOnce(jsonResponse([]));

    const projects = await fetchGitHubUserProjects("vyshn");

    expect(projects[0]).toMatchObject({
      name: "career-os",
      detectedTech: expect.arrayContaining([
        "TypeScript",
        "React",
        "Next.js",
        "Tailwind CSS",
        "Supabase"
      ])
    });
  });
});
