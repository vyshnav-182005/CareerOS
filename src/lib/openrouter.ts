import { CareerProfileSchema, type CareerProfile } from "./profile-schema";
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

// Updated extractJson with fallback to last closing brace
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

  // 3. Fallback: find the first top-level JSON object via bracket matching
  const start = raw.indexOf("{");
  if (start === -1) {
    throw new SyntaxError("No JSON object found in response");
  }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(raw.slice(start, i + 1));
      }
    }
  }

  // If we reach here, JSON is incomplete. Attempt to truncate to the last closing brace.
  const lastClose = raw.lastIndexOf('}');
  if (lastClose !== -1 && lastClose > start) {
    try {
      return JSON.parse(raw.slice(start, lastClose + 1));
    } catch {
      // fall through
    }
  }

  // Last resort: try parsing from start of '{' to end (may still fail)
  return JSON.parse(raw.slice(start));
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
