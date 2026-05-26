import { NextResponse } from "next/server";
import { fetchGitHubRepository, GitHubRepositoryError } from "../../../lib/github";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const url = getUrlFromBody(body);
    const result = await fetchGitHubRepository(url);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GitHubRepositoryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("GitHub repository analysis error", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "GitHub repository analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

function getUrlFromBody(body: unknown): string {
  if (!body || typeof body !== "object" || !("url" in body)) {
    throw new GitHubRepositoryError("GitHub repository URL is required.", 400);
  }

  const url = (body as { url: unknown }).url;
  if (typeof url !== "string" || !url.trim()) {
    throw new GitHubRepositoryError("GitHub repository URL is required.", 400);
  }

  return url;
}
