import axios from 'axios';
import type { JobPosting } from './job-search';

/**
 * Map a single JSearch API result to our internal JobPosting shape.
 */
function mapJob(job: any): JobPosting {
  return {
    title: job.job_title ?? '',
    company: job.employer_name ?? '',
    location: [job.job_city, job.job_state, job.job_country]
      .filter(Boolean)
      .join(', '),
    remote: job.job_is_remote ?? false,
    employmentType: job.job_employment_type ?? '',
    experienceLevel: job.job_required_experience?.experience_level ?? '',
    description: (job.job_description ?? '').slice(0, 1000),
    requirements: job.job_required_skills ?? [],
    responsibilities: job.job_highlights?.Responsibilities ?? [],
    skills: job.job_required_skills ?? [],
    technologies: [],
    salaryRange: job.job_min_salary && job.job_max_salary
      ? `${job.job_min_salary} - ${job.job_max_salary} ${job.job_salary_currency ?? ''}`
      : '',
    source: 'JSearch',
    sourceUrl: job.job_google_link ?? '',
    postedAt: job.job_posted_at_datetime_utc ?? '',
    applicationUrl: job.job_apply_link ?? '',
  };
}

/**
 * Run a single JSearch API query and return mapped results.
 */
async function searchJSearch(
  query: string,
  location: string
): Promise<JobPosting[]> {
  const params: Record<string, unknown> = {
    query,
    page: 1,
    num_pages: 1,
  };
  if (location) {
    params.locality = location;
  }

  console.log(`[jsearch] Searching: "${query}"`);

  const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
    headers: {
      'X-RapidAPI-Key': process.env.JSEARCH_API_KEY ?? '',
      'X-RapidAPI-Host': process.env.JSEARCH_HOST ?? 'jsearch.p.rapidapi.com',
    },
    params,
  });

  return (response.data?.data ?? []).map(mapJob);
}

/**
 * Fetch live job postings from JSearch API based on a candidate profile.
 * Runs multiple targeted queries (one per target role + top skills) for
 * better coverage than a single broad query.
 */
export async function fetchJSearchJobs(profile: any): Promise<JobPosting[]> {
  // Extract skills – could be string[] or {name:string}[]
  const rawSkills =
    profile.skills ??
    profile.candidate?.skills ??
    profile.userProvided?.skills ??
    [];
  const skills: string[] = rawSkills
    .map((s: any) => (typeof s === 'string' ? s : s?.name ?? ''))
    .filter(Boolean);
  const topSkills = skills.slice(0, 2).join(' ');

  // Extract target roles
  const targetRoles: string[] =
    profile.userProvided?.targetRoles ??
    profile.roleFocus ??
    [];

  // Fall back to title/headline if no explicit roles
  if (targetRoles.length === 0) {
    const fallback =
      profile.title ?? profile.candidate?.title ?? profile.headline ?? '';
    if (fallback) {
      targetRoles.push(fallback);
    }
  }

  if (targetRoles.length === 0 && !topSkills) {
    console.warn('[jsearch] No target roles or skills found, skipping JSearch fetch.');
    return [];
  }

  const location = profile.candidate?.location ?? profile.location ?? '';

  // Build focused queries: each target role
  // Limit to 3 queries to stay within rate limits
  const queries: string[] = targetRoles.length > 0
    ? targetRoles.slice(0, 3)
    : [topSkills].filter(Boolean);

  // Run all queries in parallel
  const allJobs: JobPosting[] = [];
  const seen = new Set<string>();

  const results = await Promise.allSettled(
    queries.map((q) => searchJSearch(q, location))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const job of result.value) {
        // Deduplicate by application URL or title+company
        const key = job.applicationUrl || `${job.title}::${job.company}`;
        if (!seen.has(key)) {
          seen.add(key);
          allJobs.push(job);
        }
      }
    } else {
      console.error('[jsearch] Query failed:', result.reason?.message ?? result.reason);
    }
  }

  console.log(`[jsearch] Fetched ${allJobs.length} unique jobs from ${queries.length} queries`);
  return allJobs;
}
