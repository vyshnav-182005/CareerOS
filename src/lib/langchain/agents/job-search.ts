import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import type { CareerProfile } from "../../profile-schema";
import type { ProfileSummary } from "../../profile-summary";
import { JobSearchResultSchema } from "../schemas";
import { getOpenRouterChatModel } from "../llm";

export type RawJobPosting = {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  source?: string;
  sourceUrl?: string;
  applicationUrl?: string;
  postedAt?: string;
  salaryRange?: string;
  [key: string]: unknown;
};

export type JobSearchAgentInput = {
  candidateProfile: CareerProfile | ProfileSummary;
  rawJobPostings?: RawJobPosting[];
  sourceHints?: string[];
  targetRoles?: string[];
  skills?: string[];
  projects?: Array<{ name: string; technologies: string[]; summary: string }>;
  maxResults?: number;
};

export function createJobSearchChain() {
  const parser = StructuredOutputParser.fromZodSchema(JobSearchResultSchema);
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Return only valid JSON. No markdown unless required by the user."
    ],
    [
      "human",
      `You are a job search agent. Your goal is to find the BEST matching jobs for a candidate based on their target roles, skills, and project experience.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown backticks, no extra text.
2. Never use null values. Use empty strings "", false, or empty arrays [] instead.
3. Do not invent job postings, companies, URLs, salaries, or dates.
4. Only include jobs that appear in rawJobPostings. If no rawJobPostings are provided, return an empty jobs array.
5. Deduplicate jobs by title, company, and applicationUrl/sourceUrl when possible.

ROLE MATCHING STRATEGY:
- The candidate's TARGET ROLES are listed below. Prioritize jobs that match these roles.
- Also consider roles that ALIGN with the candidate's skills and project work, even if not explicitly listed as target roles.
- For each job, extract skills and technologies from its description and match them against the candidate's skill set.
- Rank and prioritize jobs where the candidate's project experience demonstrates relevant competency.
- Generate searchTerms that combine target roles with the candidate's strongest skills.

TARGET ROLES (user specified):
{targetRoles}

CANDIDATE SKILLS:
{skills}

CANDIDATE PROJECTS (demonstrates practical ability):
{projects}

Return ONLY valid JSON in this exact format:
{{{{
  "searchTerms": ["Role + skill keyword queries"],
  "targetRoles": ["Roles matching candidate profile"],
  "sources": ["Source name or hint"],
  "jobs": [
    {{{{
      "title": "string or empty",
      "company": "string or empty",
      "location": "string or empty",
      "remote": false,
      "employmentType": "string or empty",
      "experienceLevel": "string or empty",
      "description": "string or empty",
      "requirements": ["requirement"],
      "responsibilities": ["responsibility"],
      "skills": ["skill"],
      "technologies": ["technology"],
      "salaryRange": "string or empty",
      "source": "string or empty",
      "sourceUrl": "string or empty",
      "postedAt": "string or empty",
      "applicationUrl": "string or empty"
    }}}}
  ]
}}}}

Full candidate profile:
{candidateProfile}

Source hints:
{sourceHints}

Maximum jobs to return: {maxResults}

Raw job postings to normalize and rank:
{rawJobPostings}`
    ]
  ]);

  const model = getOpenRouterChatModel(0.1);

  return RunnableSequence.from([
    // Serialize all inputs into template-ready strings
    (input: JobSearchAgentInput) => {
      // Truncate descriptions of raw jobs to save tokens
      const existing = input.rawJobPostings ?? [];
      const trimmed = existing.map((job: Record<string, unknown>) => ({
        ...job,
        description:
          typeof job.description === "string" && job.description.length > 500
            ? job.description.substring(0, 500) + "..."
            : job.description ?? "",
      }));

      return {
        candidateProfile: JSON.stringify(input.candidateProfile, null, 2),
        sourceHints: JSON.stringify(input.sourceHints ?? [], null, 2),
        targetRoles: JSON.stringify(input.targetRoles ?? [], null, 2),
        skills: JSON.stringify(input.skills ?? [], null, 2),
        projects: JSON.stringify(input.projects ?? [], null, 2),
        maxResults: String(input.maxResults ?? 10),
        rawJobPostings: JSON.stringify(trimmed, null, 2)
      };
    },
    prompt,
    model,
    parser
  ]);
}

