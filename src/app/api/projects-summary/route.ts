import { NextResponse } from "next/server";
import { fetchGitHubUserProjects, GitHubRepositoryError } from "../../../lib/github";
import { generateProjectSummaries, OpenRouterError } from "../../../lib/openrouter";

export const runtime = "nodejs";

export type ProjectSummaryResponse = {
  projects: Array<{
    title: string;
    url: string;
    description: string | null;
    language: string | null;
    topics: string[];
    stars: number;
    techStack: string[];
    atsPoints: string[];
  }>;
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const username = getGitHubIdentityFromBody(body);
    
    // Fetch all projects from GitHub
    const projects = await fetchGitHubUserProjects(username);

    if (projects.length === 0) {
      return NextResponse.json(
        { projects: [] },
        { status: 200 }
      );
    }

    // Filter to relevant projects (exclude forks and very small repos if desired)
    // For now, include all public repos
    const projectsForLLM = projects.map((project) => ({
      name: project.name,
      url: project.url,
      description: project.description || "No description provided",
      language: project.language || "Not specified",
      stars: project.stars,
      topics: project.topics,
      detectedTech: project.detectedTech
    }));

    // Generate ATS-friendly summaries using LLM
    const summaries = await generateProjectSummaries(projectsForLLM);
    const projectsByName = new Map(projects.map((project) => [project.name, project]));
    const projectsWithMetadata = summaries.map((summary) => {
      const project = projectsByName.get(summary.title);

      return {
        title: summary.title,
        url: project?.url ?? "",
        description: project?.description ?? null,
        language: project?.language ?? null,
        topics: project?.topics ?? [],
        stars: project?.stars ?? 0,
        techStack: mergeTechStack(project?.detectedTech ?? [], summary.techStack),
        atsPoints: summary.atsPoints
      };
    });

    return NextResponse.json(
      { projects: projectsWithMetadata },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof GitHubRepositoryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof OpenRouterError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("Projects summary generation error", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to generate project summaries. Please try again." },
      { status: 500 }
    );
  }
}

function mergeTechStack(primary: string[], secondary: string[]): string[] {
  const normalized = new Map<string, string>();

  for (const tech of [...primary, ...secondary]) {
    const trimmed = tech.trim();
    if (!trimmed) continue;
    normalized.set(trimmed.toLowerCase(), trimmed);
  }

  return Array.from(normalized.values());
}

function getGitHubIdentityFromBody(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw new GitHubRepositoryError("GitHub profile URL or username is required.", 400);
  }

  const username = (body as { username?: unknown }).username;
  if (typeof username !== "string" || !username.trim()) {
    const githubUrl = (body as { githubUrl?: unknown }).githubUrl;

    if (typeof githubUrl !== "string" || !githubUrl.trim()) {
      throw new GitHubRepositoryError("GitHub profile URL or username is required.", 400);
    }

    return parseGitHubProfileUrl(githubUrl);
  }

  return username.trim();
}

function parseGitHubProfileUrl(input: string): string {
  try {
    const url = new URL(input.trim());
    const [username, extraPath] = url.pathname.split("/").filter(Boolean);

    if (url.hostname !== "github.com" || !username || extraPath) {
      throw new Error("Invalid GitHub profile URL");
    }

    return username;
  } catch {
    throw new GitHubRepositoryError("Enter a valid GitHub profile URL.", 400);
  }
}
