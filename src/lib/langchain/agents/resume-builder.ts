import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ResumeDataSchema } from "../../resume-schema";
import { getOpenRouterChatModel } from "../llm";

export type ResumeBuilderInput = {
  /** The user's full name */
  fullName: string;
  /** The user's email */
  email: string;
  /** The user's phone number (optional) */
  phone?: string;
  /** LinkedIn URL */
  linkedin?: string;
  /** GitHub URL */
  github?: string;
  /** Personal website URL */
  website?: string;
  /** User's skills list */
  skills: string[];
  /** User's education records */
  education: Array<{
    institution: string;
    degree: string;
    branch: string;
    dates: string;
    cgpa?: string;
  }>;
  /** User's work experience */
  experience: Array<{
    title: string;
    organization: string;
    dates: string;
    summary: string;
  }>;
  /** User's GitHub projects with tech stacks */
  projects: Array<{
    title: string;
    description: string | null;
    techStack: string[];
    atsPoints: string[];
    url?: string;
  }>;
  /** The target job title */
  jobTitle: string;
  /** The target company name */
  companyName: string;
  /** The FULL job description to tailor the resume for */
  jobDescription: string;
};

export function createResumeBuilderChain() {
  const parser = StructuredOutputParser.fromZodSchema(ResumeDataSchema);

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Return only valid JSON. No markdown backticks, no extra text.",
    ],
    [
      "human",
      `You are an expert resume optimization agent. Your job is to take a candidate's profile data and a TARGET job description, then produce a perfectly tailored, ATS-optimized resume in structured JSON format.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown backticks, no extra text.
2. Never use null values. Use empty strings "" or empty arrays [] instead.
3. NEVER fabricate experience, companies, degrees, or metrics the candidate does not have.
4. You MAY rephrase, restructure, and reorder existing data to better match the JD.
5. You MAY infer reasonable quantifications from context (e.g., "built a web app" → "Developed a full-stack web application serving 100+ users") ONLY when the context supports it.
6. Keep the resume to ONE page — be selective about what to include.

TAILORING STRATEGY:
1. **Analyze the JD** — identify required skills, technologies, responsibilities, and keywords.
2. **Match skills** — front-load technologies and skills that appear in the JD in the Technical Skills section.
3. **Rewrite bullets** — for each experience and project bullet, incorporate JD keywords naturally. Use the STAR method (Situation, Task, Action, Result).
4. **Prioritize relevance** — put the most JD-relevant experience and projects first. Drop items that have no relevance to save space.
5. **Quantify** — add metrics where the data supports it (users, percentage improvements, scale).
6. **ATS keywords** — naturally weave in exact keyword phrases from the JD requirements.

TARGET JOB:
Title: {jobTitle}
Company: {companyName}

FULL JOB DESCRIPTION:
{jobDescription}

CANDIDATE DATA:
Name: {fullName}
Email: {email}
Phone: {phone}
LinkedIn: {linkedin}
GitHub: {github}
Website: {website}

SKILLS:
{skills}

EDUCATION:
{education}

WORK EXPERIENCE:
{experience}

PROJECTS (from GitHub and manual entries):
{projects}

Return ONLY valid JSON in this exact format:
{{{{
  "contactInfo": {{{{
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone or empty string",
    "linkedin": "full linkedin URL or empty string",
    "github": "full github URL or empty string",
    "website": "full website URL or empty string"
  }}}},
  "education": [
    {{{{
      "institution": "University Name",
      "location": "City, State",
      "degree": "Degree — Field of Study",
      "dates": "Start — End",
      "gpa": "GPA or empty string",
      "highlights": ["Relevant coursework, honors, activities"]
    }}}}
  ],
  "experience": [
    {{{{
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "dates": "Start — End",
      "bullets": [
        "Action verb + what you did + result/impact (with metrics when possible)",
        "Each bullet tailored to match JD requirements"
      ]
    }}}}
  ],
  "projects": [
    {{{{
      "name": "Project Name",
      "technologies": "Tech1, Tech2, Tech3",
      "bullets": [
        "What the project does and your role, using JD-relevant keywords",
        "Technical implementation details highlighting relevant skills"
      ]
    }}}}
  ],
  "technicalSkills": [
    {{{{
      "category": "Languages",
      "skills": "Python, JavaScript, TypeScript, Java"
    }}}},
    {{{{
      "category": "Frameworks",
      "skills": "React, Next.js, Node.js, Django"
    }}}},
    {{{{
      "category": "Tools & Platforms",
      "skills": "Git, Docker, AWS, MongoDB"
    }}}}
  ]
}}}}

IMPORTANT FORMATTING NOTES:
- For technicalSkills: group skills into 3-5 categories. Front-load skills that appear in the JD.
- For experience bullets: start each with a strong action verb. Include 3-5 bullets per role.
- For project bullets: include 2-3 bullets per project. Mention specific technologies used.
- For education highlights: include relevant coursework, honors, or activities only if they relate to the JD.
- Omit sections/items that are completely irrelevant to the target job to keep it concise.`,
    ],
  ]);

  const model = getOpenRouterChatModel(0.2);

  return RunnableSequence.from([
    // Serialize all inputs into template-ready strings
    (input: ResumeBuilderInput) => ({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone || "",
      linkedin: input.linkedin || "",
      github: input.github || "",
      website: input.website || "",
      skills: JSON.stringify(input.skills, null, 2),
      education: JSON.stringify(input.education, null, 2),
      experience: JSON.stringify(input.experience, null, 2),
      projects: JSON.stringify(input.projects, null, 2),
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      jobDescription: input.jobDescription,
    }),
    prompt,
    model,
    parser,
  ]);
}
