export type ParsedGitHubRepo = {
  owner: string;
  repo: string;
};

export type NormalizedGitHubRepository = {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
  description: string | null;
  homepage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  defaultBranch: string;
  language: string | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  readme: string;
  detectedTech: string[];
  projectSummary: string;
};

type GitHubRepoApiResponse = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  default_branch: string;
  language: string | null;
  topics?: string[];
  created_at: string;
  updated_at: string;
};

type GitHubReadmeApiResponse = {
  content?: string;
  encoding?: string;
};

export class GitHubRepositoryError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "GitHubRepositoryError";
  }
}

export function parseGitHubRepoUrl(input: string): ParsedGitHubRepo {
  try {
    const url = new URL(input.trim());
    const [owner, rawRepo] = url.pathname.split("/").filter(Boolean);
    const repo = rawRepo?.replace(/\.git$/i, "");

    if (url.hostname !== "github.com" || !owner || !repo) {
      throw new Error("Invalid GitHub URL");
    }

    return { owner, repo };
  } catch {
    throw new GitHubRepositoryError("Enter a valid GitHub repository URL.", 400);
  }
}

export async function fetchGitHubRepository(inputUrl: string): Promise<{
  repository: NormalizedGitHubRepository;
}> {
  const { owner, repo } = parseGitHubRepoUrl(inputUrl);
  const metadataResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      accept: "application/vnd.github+json"
    }
  });

  if (!metadataResponse.ok) {
    throw mapGitHubError(metadataResponse);
  }

  const metadata = (await metadataResponse.json()) as GitHubRepoApiResponse;
  const readme = await fetchReadme(owner, repo);
  const detectedTech = detectTech({
    language: metadata.language,
    topics: metadata.topics ?? [],
    description: metadata.description,
    homepage: metadata.homepage,
    readme
  });

  return {
    repository: {
      owner,
      repo: metadata.name,
      fullName: metadata.full_name,
      url: metadata.html_url,
      description: metadata.description,
      homepage: metadata.homepage,
      stars: metadata.stargazers_count,
      forks: metadata.forks_count,
      watchers: metadata.watchers_count,
      openIssues: metadata.open_issues_count,
      defaultBranch: metadata.default_branch,
      language: metadata.language,
      topics: metadata.topics ?? [],
      createdAt: metadata.created_at,
      updatedAt: metadata.updated_at,
      readme,
      detectedTech,
      projectSummary: metadata.description || firstReadmeLine(readme) || "No repository description available."
    }
  };
}

export type UserProject = {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  topics: string[];
  detectedTech: string[];
};

export async function fetchGitHubUserProjects(username: string): Promise<UserProject[]> {
  const projects: UserProject[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100&page=${page}`,
      {
        headers: {
          accept: "application/vnd.github+json"
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new GitHubRepositoryError("GitHub user not found.", 404);
      }
      throw mapGitHubError(response);
    }

    const repos = (await response.json()) as GitHubRepoApiResponse[];
    
    if (repos.length === 0) {
      hasMore = false;
    } else {
      projects.push(
        ...repos.map((repo) => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          topics: repo.topics ?? [],
          detectedTech: detectTech({
            language: repo.language,
            topics: repo.topics ?? [],
            description: repo.description,
            homepage: repo.homepage,
            readme: ""
          })
        }))
      );
      page++;
    }
  }

  return projects;
}

async function fetchReadme(owner: string, repo: string): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: {
      accept: "application/vnd.github+json"
    }
  });

  if (response.status === 404) {
    return "";
  }

  if (!response.ok) {
    throw mapGitHubError(response);
  }

  const readme = (await response.json()) as GitHubReadmeApiResponse;
  if (readme.encoding !== "base64" || !readme.content) {
    return "";
  }

  return Buffer.from(readme.content.replace(/\n/g, ""), "base64").toString("utf8");
}

function mapGitHubError(response: Response): GitHubRepositoryError {
  if (response.status === 404) {
    return new GitHubRepositoryError("GitHub repository was not found or is not public.", 404);
  }

  if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
    return new GitHubRepositoryError("GitHub API rate limit exceeded. Please try again later.", 429);
  }

  return new GitHubRepositoryError("GitHub repository could not be fetched.", 502);
}

function firstReadmeLine(readme: string): string {
  return readme
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .find(Boolean) ?? "";
}

function detectTech(input: {
  language: string | null;
  topics: string[];
  description: string | null;
  homepage: string | null;
  readme: string;
}): string[] {
  const detected = new Set<string>();
  if (input.language) {
    detected.add(input.language);
  }

  const haystack = [
    ...input.topics,
    input.description,
    input.homepage,
    input.readme
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const keywordMap: Array<[RegExp, string]> = [
    [/\b(next\.?js|nextjs)\b/, "Next.js"],
    [/\breact\b/, "React"],
    [/\btypescript\b/, "TypeScript"],
    [/\bjavascript\b/, "JavaScript"],
    [/\bnode\.?js\b/, "Node.js"],
    [/\btailwind(css)?\b/, "Tailwind CSS"],
    [/\bpostgres(ql)?\b/, "PostgreSQL"],
    [/\bpython\b/, "Python"],
    [/\bfastapi\b/, "FastAPI"],
    [/\bdocker\b/, "Docker"],
    [/\bsupabase\b/, "Supabase"],
    [/\bvercel\b/, "Vercel"]
  ];

  for (const [pattern, label] of keywordMap) {
    if (pattern.test(haystack)) {
      detected.add(label);
    }
  }

  return Array.from(detected);
}
