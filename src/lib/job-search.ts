import { z } from "zod";

export const JobPostingSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  location: z.string().default(""),
  remote: z.boolean().default(false),
  employmentType: z.string().default(""),
  experienceLevel: z.string().default(""),
  description: z.string().default(""),
  requirements: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  salaryRange: z.string().default(""),
  source: z.string().default(""),
  sourceUrl: z.string().default(""),
  postedAt: z.string().default(""),
  applicationUrl: z.string().default("")
});

export const JobSearchResultSchema = z.object({
  searchTerms: z.array(z.string()).default([]),
  targetRoles: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  jobs: z.array(JobPostingSchema).default([])
});

export type JobPosting = z.infer<typeof JobPostingSchema>;
export type JobSearchResult = z.infer<typeof JobSearchResultSchema>;
