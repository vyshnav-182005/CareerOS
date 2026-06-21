import type { RawJobPosting } from "../lib/langchain/agents/job-search";

/**
 * Fetch job postings from the JSearch API based on a candidate profile.
 *
 * The function expects a candidate profile object (CareerProfile or ProfileSummary).
 * It extracts a simple search query from the profile (title, skills, and experience)
 * and calls the JSearch public endpoint. The returned jobs are mapped to the
 * {@link RawJobPosting} shape expected by the job‑search agent.
 *
 * The JSearch API key must be provided via the environment variable
 * `JSEARCH_API_KEY`. If the key is missing the function returns an empty array
 * and logs a warning – this keeps the application functional in development
 * environments without failing at runtime.
 */
export async function fetchJSearchJobs(
  profile: Record<string, unknown>
): Promise<RawJobPosting[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    console.warn("JSEARCH_API_KEY is not configured – returning no jobs.");
    return [];
  }

  // Build a basic query string from the profile. We look for common fields.
  const parts: string[] = [];
  if (typeof profile.title === "string") parts.push(profile.title);
  if (typeof profile.summary === "string") parts.push(profile.summary);
  if (Array.isArray(profile.skills)) {
    parts.push(...profile.skills.filter((s) => typeof s === "string") as string[]);
  }
  if (Array.isArray((profile as any).experience)) {
    const exp = (profile as any).experience as any[];
    exp.forEach((e) => {
      if (e.title && typeof e.title === "string") parts.push(e.title);
      if (e.company && typeof e.company === "string") parts.push(e.company);
    });
  }

  const query = parts.join(" ");
  if (!query) {
    return [];
  }

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.append("query", query);
  // Optional parameters – limit results to a reasonable number.
  url.searchParams.append("page", "1");
  url.searchParams.append("num_pages", "1");

  const host = process.env.JSEARCH_HOST ?? "jsearch.p.rapidapi.com";

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": host,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    console.error(`JSearch request failed: ${response.status} ${response.statusText}`);
    return [];
  }

  const data = await response.json();
  // The shape of JSearch results varies; we map known fields to RawJobPosting.
  const jobs: RawJobPosting[] = (data?.data ?? []).map((job: any) => ({
    title: job.title ?? "",
    company: job.employer?.name ?? job.company ?? "",
    location: job.location ?? "",
    description: job.description ?? "",
    source: "JSearch",
    sourceUrl: job.job_url ?? "",
    applicationUrl: job.apply_url ?? "",
    postedAt: job.posted_at ?? "",
    salaryRange: job.salary ?? "",
    // Preserve any extra fields for future use.
    ...job,
  }));

  return jobs;
}
