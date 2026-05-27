import { beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubRepositoryError } from "../../../lib/github";
import { OpenRouterError } from "../../../lib/openrouter";

vi.mock("../../../lib/github", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/github")>("../../../lib/github");

  return {
    ...actual,
    fetchGitHubUserProjects: vi.fn()
  };
});

vi.mock("../../../lib/openrouter", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/openrouter")>(
    "../../../lib/openrouter"
  );

  return {
    ...actual,
    generateProjectSummaries: vi.fn()
  };
});

import { fetchGitHubUserProjects } from "../../../lib/github";
import { generateProjectSummaries } from "../../../lib/openrouter";
import { POST } from "./route";

const repos = [
  {
    name: "career-os",
    url: "https://github.com/vyshn/career-os",
    description: "AI career profile builder",
    language: "TypeScript",
    stars: 12,
    topics: ["nextjs", "ats"],
    detectedTech: ["TypeScript", "Next.js"]
  },
  {
    name: "api-lab",
    url: "https://github.com/vyshn/api-lab",
    description: null,
    language: "Python",
    stars: 2,
    topics: [],
    detectedTech: ["Python", "FastAPI"]
  }
];

const summaries = [
  {
    title: "career-os",
    techStack: ["TypeScript", "Next.js", "React"],
    atsPoints: ["Built an AI career profile builder.", "Implemented ATS project summaries."]
  },
  {
    title: "api-lab",
    techStack: ["Python", "FastAPI"],
    atsPoints: ["Developed API experiments in Python."]
  }
];

describe("POST /api/projects-summary", () => {
  beforeEach(() => {
    vi.mocked(fetchGitHubUserProjects).mockReset();
    vi.mocked(generateProjectSummaries).mockReset();
  });

  it("accepts a GitHub profile URL and returns repo metadata with ATS points", async () => {
    vi.mocked(fetchGitHubUserProjects).mockResolvedValueOnce(repos);
    vi.mocked(generateProjectSummaries).mockResolvedValueOnce(summaries);

    const response = await POST(
      new Request("http://localhost/api/projects-summary", {
        method: "POST",
        body: JSON.stringify({ githubUrl: "https://github.com/vyshn" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchGitHubUserProjects).toHaveBeenCalledWith("vyshn");
    expect(generateProjectSummaries).toHaveBeenCalledWith([
      {
        name: "career-os",
        url: "https://github.com/vyshn/career-os",
        description: "AI career profile builder",
        language: "TypeScript",
        stars: 12,
        topics: ["nextjs", "ats"],
        detectedTech: ["TypeScript", "Next.js"]
      },
      {
        name: "api-lab",
        url: "https://github.com/vyshn/api-lab",
        description: "No description provided",
        language: "Python",
        stars: 2,
        topics: [],
        detectedTech: ["Python", "FastAPI"]
      }
    ]);
    expect(body.projects).toEqual([
      {
        title: "career-os",
        url: "https://github.com/vyshn/career-os",
        description: "AI career profile builder",
        language: "TypeScript",
        topics: ["nextjs", "ats"],
        stars: 12,
        techStack: ["TypeScript", "Next.js", "React"],
        atsPoints: ["Built an AI career profile builder.", "Implemented ATS project summaries."]
      },
      {
        title: "api-lab",
        url: "https://github.com/vyshn/api-lab",
        description: null,
        language: "Python",
        topics: [],
        stars: 2,
        techStack: ["Python", "FastAPI"],
        atsPoints: ["Developed API experiments in Python."]
      }
    ]);
  });

  it("still accepts a username", async () => {
    vi.mocked(fetchGitHubUserProjects).mockResolvedValueOnce(repos);
    vi.mocked(generateProjectSummaries).mockResolvedValueOnce(summaries);

    const response = await POST(
      new Request("http://localhost/api/projects-summary", {
        method: "POST",
        body: JSON.stringify({ username: "vyshn" })
      })
    );

    expect(response.status).toBe(200);
    expect(fetchGitHubUserProjects).toHaveBeenCalledWith("vyshn");
  });

  it("returns 400 when GitHub identity is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects-summary", {
        method: "POST",
        body: JSON.stringify({})
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("GitHub profile URL or username is required.");
  });

  it("returns 400 for an invalid GitHub URL", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects-summary", {
        method: "POST",
        body: JSON.stringify({ githubUrl: "https://example.com/vyshn" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Enter a valid GitHub profile URL.");
  });

  it("returns GitHub errors with their status code", async () => {
    vi.mocked(fetchGitHubUserProjects).mockRejectedValueOnce(
      new GitHubRepositoryError("GitHub user not found.", 404)
    );

    const response = await POST(
      new Request("http://localhost/api/projects-summary", {
        method: "POST",
        body: JSON.stringify({ username: "missing" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("GitHub user not found.");
  });

  it("returns OpenRouter errors as generation failures", async () => {
    vi.mocked(fetchGitHubUserProjects).mockResolvedValueOnce(repos);
    vi.mocked(generateProjectSummaries).mockRejectedValueOnce(
      new OpenRouterError("OPENROUTER_API_KEY is not configured.")
    );

    const response = await POST(
      new Request("http://localhost/api/projects-summary", {
        method: "POST",
        body: JSON.stringify({ username: "vyshn" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("OPENROUTER_API_KEY is not configured.");
  });
});
