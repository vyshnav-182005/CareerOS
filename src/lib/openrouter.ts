import { CareerProfileSchema, type CareerProfile } from "./profile-schema";
import { ProfileSummarySchema, type ProfileSummary } from "./profile-summary";
import type { ResumeSections } from "./sections";

export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

type OpenRouterPayload = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

type ProfileSummaryProject = {
  title: string;
  description: string | null;
  techStack: string[];
  atsPoints: string[];
};

function buildPrompt(rawText: string, sections: ResumeSections): string {
  return `You are a resume intelligence agent. Convert the resume into strict JSON.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown backticks, no extra text.
2. Never use null values. Use empty strings "" or omit optional fields entirely.
3. All arrays must contain objects (not primitive strings).
4. Do not invent names, companies, dates, credentials, or links.

FOR EXPLICIT SKILLS: Always return objects like this:
[
  {"name": "Python", "evidence": "Used in ML projects"},
  {"name": "JavaScript"},
  {"name": "React.js", "evidence": "Built web applications"}
]
- Include "evidence" field only if you have supporting evidence
- Do NOT use null - either provide a string or omit the field
- Never include the skill name as a separate array element

EXACT JSON SCHEMA:
{
  "candidate": {
    "name": "string or empty",
    "headline": "string or empty",
    "contacts": ["email", "phone"],
    "location": "string or empty",
    "links": ["url1", "url2"]
  },
  "executiveSummary": "2-3 sentences",
  "explicitSkills": [
    {"name": "SkillName", "evidence": "optional string"}
  ],
  "inferredSkills": [
    {"name": "Skill", "confidence": "high", "rationale": "reason"}
  ],
  "technicalDepth": [
    {"area": "Topic", "level": "advanced", "rationale": "reason"}
  ],
  "experience": [
    {"title": "Role", "organization": "Company", "dates": "2023-2024", "summary": "desc", "outcomes": ["result"]}
  ],
  "projects": [
    {"name": "Name", "summary": "desc", "technologies": ["tech"], "complexitySignals": ["signal"], "impact": "outcome"}
  ],
  "education": [
    {"institution": "Uni", "credential": "Degree", "dates": "2020-2024", "details": ["detail1"]}
  ],
  "roleAlignment": [
    {"role": "Engineer", "score": 85, "rationale": "reason", "strengths": ["s1"], "gaps": ["g1"]}
  ],
  "strengths": [
    {"title": "Leadership", "evidence": "shown by..."}
  ],
  "gaps": [
    {"title": "DevOps", "recommendation": "take course"}
  ],
  "recommendations": ["rec1"],
  "evidence": ["snippet1", "snippet2"]
}

Detected sections:
${JSON.stringify(sections, null, 2)}

Raw resume text:
${rawText.slice(0, 18000)}`;
}

// Updated extractJson with bracket matching for objects or arrays
function extractJson(content: string): unknown {
  const trimmed = content.trim();

  // 1. Strip markdown fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : trimmed).trim();

  // 2. Try direct parse first (fast path)
  try {
    return JSON.parse(raw);
  } catch {
    // continue to fallback
  }

  // 3. Fallback: find the first top-level JSON object or array via bracket matching
  const objectStart = raw.indexOf("{");
  const arrayStart = raw.indexOf("[");
  let start = -1;

  if (objectStart === -1 && arrayStart === -1) {
    throw new SyntaxError("No JSON object or array found in response");
  }

  if (objectStart === -1) {
    start = arrayStart;
  } else if (arrayStart === -1) {
    start = objectStart;
  } else {
    start = Math.min(objectStart, arrayStart);
  }

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) {
        escape = true;
      }
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") stack.push("}");
    if (ch === "[") stack.push("]");

    if (ch === "}" || ch === "]") {
      const expected = stack.pop();
      if (expected && ch !== expected) {
        throw new SyntaxError("Mismatched JSON brackets in response");
      }
      if (stack.length === 0) {
        return JSON.parse(raw.slice(start, i + 1));
      }
    }
  }

  throw new SyntaxError("No complete JSON block found in response");
}


export async function analyzeResumeWithOpenRouter(
  rawText: string,
  sections: ResumeSections
): Promise<CareerProfile> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not configured.");
  }

  let response: Response;

  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_SITE_NAME ?? "CareerOS"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4-mini",
        messages: [
          {
            role: "system",
            content: "Return only valid JSON. No markdown unless required by the user."
          },
          { role: "user", content: buildPrompt(rawText, sections) }
        ],
        temperature: 0.2
      })
    });
  } catch {
    throw new OpenRouterError("Could not connect to OpenRouter. Check your network and API configuration.");
  }

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      // ignore
    }
    console.error("OpenRouter error response", {
      status: response.status,
      body: errorBody.slice(0, 500)
    });
    throw new OpenRouterError(`OpenRouter request failed with status ${response.status}.`);
  }

  let payload: unknown;
  let responseText = "";
  try {
    responseText = await response.text();
    payload = JSON.parse(responseText);
  } catch (error) {
    console.error("OpenRouter JSON parse error", {
      error: error instanceof Error ? error.message : String(error),
      responseLength: responseText.length,
      responseSample: responseText.slice(0, 200)
    });
    throw new OpenRouterError("OpenRouter returned a response that was not valid JSON.");
  }

  if (!payload || typeof payload !== "object") {
    throw new OpenRouterError("OpenRouter returned an invalid response shape.");
  }

  const content = (payload as OpenRouterPayload).choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new OpenRouterError("OpenRouter returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch (error) {
    console.error("OpenRouter JSON extraction error", {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content.length,
      contentSample: content.slice(0, 500)
    });
    throw new OpenRouterError("OpenRouter returned invalid JSON syntax.");
  }

  try {
    return CareerProfileSchema.parse(parsed);
  } catch (error) {
    console.error("CareerProfileSchema validation error", {
      error: error instanceof Error ? error.message : String(error),
      parsed: JSON.stringify(parsed).slice(0, 1000)
    });
    throw new OpenRouterError("OpenRouter returned invalid profile JSON.");
  }
}

function buildProfileSummaryPrompt(
  profile: CareerProfile,
  githubProjects: ProfileSummaryProject[]
): string {
  return `You are a profile summarizer agent. Convert the full profile into a concise, structured skill and role summary for search and resume generation.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown backticks, no extra text.
2. Never use null values. Use empty strings "" or empty arrays [] instead.
3. Do not invent facts, dates, roles, employers, or metrics.
4. Use the GitHub project data to infer skills or role focus when supported by evidence.

Return ONLY valid JSON in this exact format:
{
  "headline": "1-2 sentences max",
  "roleFocus": ["Role 1", "Role 2"],
  "skillFocus": ["Skill 1", "Skill 2"],
  "domainFocus": ["Domain 1", "Domain 2"],
  "evidence": ["Short evidence snippets tied to resume or GitHub projects"],
  "userProvided": {
    "skills": ["Skill from user input"],
    "interests": ["Interest from user input"],
    "targetRoles": ["Target role from user input"],
    "education": [
      {
        "institution": "string or empty",
        "credential": "string or empty",
        "dates": "string or empty",
        "details": ["detail"]
      }
    ],
    "experience": [
      {
        "title": "string or empty",
        "organization": "string or empty",
        "dates": "string or empty",
        "summary": "string or empty"
      }
    ]
  }
}

Required coverage rules:
- Copy ALL user-entered details into userProvided (do not omit or rephrase).
- Use GitHub projects to infer deeper capabilities (e.g., RAG chatbot work => "RAG" and "LLM applications" in skillFocus/domainFocus).
- If information is missing, use empty strings/arrays, never null.

Profile data:
${JSON.stringify(profile, null, 2)}

GitHub projects:
${JSON.stringify(githubProjects, null, 2)}`;
}

export async function summarizeProfileWithOpenRouter(
  profile: CareerProfile,
  githubProjects: ProfileSummaryProject[] = []
): Promise<ProfileSummary> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not configured.");
  }

  let response: Response;

  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_SITE_NAME ?? "CareerOS"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4-mini",
        messages: [
          {
            role: "system",
            content: "Return only valid JSON. No markdown unless required by the user."
          },
          { role: "user", content: buildProfileSummaryPrompt(profile, githubProjects) }
        ],
        temperature: 0.2
      })
    });
  } catch {
    throw new OpenRouterError("Could not connect to OpenRouter. Check your network and API configuration.");
  }

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      // ignore
    }
    console.error("OpenRouter error response", {
      status: response.status,
      body: errorBody.slice(0, 500)
    });
    throw new OpenRouterError(`OpenRouter request failed with status ${response.status}.`);
  }

  let payload: unknown;
  let responseText = "";
  try {
    responseText = await response.text();
    payload = JSON.parse(responseText);
  } catch (error) {
    console.error("OpenRouter JSON parse error", {
      error: error instanceof Error ? error.message : String(error),
      responseLength: responseText.length,
      responseSample: responseText.slice(0, 200)
    });
    throw new OpenRouterError("OpenRouter returned a response that was not valid JSON.");
  }

  if (!payload || typeof payload !== "object") {
    throw new OpenRouterError("OpenRouter returned an invalid response shape.");
  }

  const content = (payload as OpenRouterPayload).choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new OpenRouterError("OpenRouter returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch (error) {
    console.error("OpenRouter JSON extraction error", {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content.length,
      contentSample: content.slice(0, 500)
    });
    throw new OpenRouterError("OpenRouter returned invalid JSON syntax.");
  }

  try {
    return ProfileSummarySchema.parse(parsed);
  } catch (error) {
    console.error("ProfileSummarySchema validation error", {
      error: error instanceof Error ? error.message : String(error),
      parsed: JSON.stringify(parsed).slice(0, 1000)
    });
    throw new OpenRouterError("OpenRouter returned invalid profile summary JSON.");
  }
}

export type ProjectSummary = {
  title: string;
  techStack: string[];
  atsPoints: string[];
};

export async function generateProjectSummaries(
  projects: Array<{
    name: string;
    description: string | null;
    readme?: string;
    language: string | null;
    topics: string[];
    url?: string;
    stars?: number;
    detectedTech?: string[];
  }>
): Promise<ProjectSummary[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not configured.");
  }

  const prompt = `You are an ATS (Applicant Tracking System) optimization expert and technical project storyteller. Convert the following GitHub projects into detailed, ATS-friendly bullet points that clearly explain the crux of each project.

For each project, create 4-5 detailed, achievement-oriented bullet points. Each bullet should be 22-35 words and must make the project understandable without needing to open the repository.

The bullets for each project should collectively explain:
- The core problem, user need, or workflow the project solves
- The main system design, architecture, modules, or data flow
- The implementation work, including APIs, algorithms, integrations, UI, backend, database, automation, or testing where relevant
- The technologies, language, libraries, and technical concepts visible from the repository metadata and README
- The practical outcome, capability, performance benefit, or user/business impact

Writing rules:
- Use strong action verbs such as Built, Developed, Implemented, Designed, Integrated, Automated, Optimized, or Tested
- Be specific and explanatory instead of generic; avoid vague lines like "worked on a web app"
- Infer only from the supplied project metadata; do not invent metrics, users, companies, deployments, or features not supported by the data
- If metadata is sparse, describe the likely technical scope carefully and say what the repository demonstrates rather than fabricating details
- Keep bullets scannable, keyword-rich, and resume-ready while still explaining the project's purpose and technical substance
- Return a normalized techStack array for each project using only technologies supported by language, topics, descriptions, detectedTech, or other supplied metadata
- Prefer canonical names such as "React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "MongoDB", "Supabase", "Python", or "FastAPI"

Return ONLY valid JSON in this exact format (no markdown, no extra text):
[
  {
    "title": "Project Name",
    "techStack": ["Technology 1", "Technology 2"],
    "atsPoints": [
      "Bullet point 1",
      "Bullet point 2",
      "Bullet point 3"
    ]
  }
]

Projects to analyze:
${JSON.stringify(projects, null, 2)}`;

  const attemptConfigs = [
    { temperature: 0.3, strict: false },
    { temperature: 0.0, strict: true }
  ];

  const requestSummaries = async (temperature: number, strict: boolean): Promise<string> => {
    let response: Response;

    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
          "X-Title": process.env.OPENROUTER_SITE_NAME ?? "CareerOS"
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4-mini",
          messages: [
            {
              role: "system",
              content: strict
                ? "Return only valid JSON. No markdown. No trailing commas."
                : "Return only valid JSON. No markdown unless required by the user."
            },
            { role: "user", content: prompt }
          ],
          temperature
        })
      });
    } catch {
      throw new OpenRouterError("Could not connect to OpenRouter. Check your network and API configuration.");
    }

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      console.error("OpenRouter error response", {
        status: response.status,
        body: errorBody.slice(0, 500)
      });
      throw new OpenRouterError(`OpenRouter request failed with status ${response.status}.`);
    }

    let payload: unknown;
    let responseText = "";
    try {
      responseText = await response.text();
      payload = JSON.parse(responseText);
    } catch (error) {
      console.error("OpenRouter JSON parse error", {
        error: error instanceof Error ? error.message : String(error),
        responseLength: responseText.length,
        responseSample: responseText.slice(0, 200)
      });
      throw new OpenRouterError("OpenRouter returned a response that was not valid JSON.");
    }

    if (!payload || typeof payload !== "object") {
      throw new OpenRouterError("OpenRouter returned an invalid response shape.");
    }

    const content = (payload as OpenRouterPayload).choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new OpenRouterError("OpenRouter returned an empty response.");
    }

    return content;
  };

  let lastParseError: string | null = null;

  for (const attempt of attemptConfigs) {
    const content = await requestSummaries(attempt.temperature, attempt.strict);

    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch (error) {
      lastParseError = error instanceof Error ? error.message : String(error);
      console.warn("OpenRouter JSON extraction error", {
        error: lastParseError,
        contentLength: content.length,
        contentSample: content.slice(0, 500),
        attempt: attempt.strict ? "strict" : "standard"
      });
      continue;
    }

    if (!Array.isArray(parsed)) {
      lastParseError = "OpenRouter returned invalid project summaries format.";
      continue;
    }

    return parsed.map((item: unknown) => {
      if (typeof item !== "object" || item === null || !("title" in item) || !("atsPoints" in item)) {
        throw new OpenRouterError("Invalid project summary structure.");
      }

      const { title, techStack, atsPoints } = item as Record<string, unknown>;
      if (typeof title !== "string" || !Array.isArray(atsPoints)) {
        throw new OpenRouterError("Invalid project summary data types.");
      }

      return {
        title,
        techStack: Array.isArray(techStack) ? techStack.map((tech: unknown) => String(tech)) : [],
        atsPoints: atsPoints.map((point: unknown) => String(point))
      };
    });
  }

  console.warn("OpenRouter project summaries failed after retries", {
    error: lastParseError ?? "unknown"
  });

  return [];
}
