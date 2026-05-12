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

Rules:
- Separate explicit facts from inferred insights.
- Do not invent names, companies, dates, credentials, or links.
- Inferred skills and depth must include rationale and evidence.
- Return only valid JSON matching the requested shape.

JSON shape:
{
  "candidate": {"name": string|null, "headline": string|null, "contacts": string[], "location": string|null, "links": string[]},
  "executiveSummary": string,
  "explicitSkills": [{"name": string, "evidence": string}],
  "inferredSkills": [{"name": string, "confidence": "low"|"medium"|"high", "rationale": string, "evidence": string}],
  "technicalDepth": [{"area": string, "level": "foundational"|"intermediate"|"advanced"|"expert", "rationale": string, "evidence": string}],
  "experience": [{"title": string|null, "organization": string|null, "dates": string|null, "summary": string|null, "outcomes": string[], "inferredSeniority": string|null}],
  "projects": [{"name": string, "summary": string, "technologies": string[], "complexitySignals": string[], "impact": string|null}],
  "education": [{"institution": string|null, "credential": string|null, "dates": string|null, "details": string[]}],
  "roleAlignment": [{"role": string, "score": integer 0-100, "rationale": string, "strengths": string[], "gaps": string[]}],
  "strengths": [{"title": string, "evidence": string}],
  "gaps": [{"title": string, "recommendation": string}],
  "recommendations": string[],
  "evidence": [{"id": string, "section": string, "snippet": string}]
}

Detected sections:
${JSON.stringify(sections, null, 2)}

Raw resume text:
${rawText.slice(0, 18000)}`;
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  return JSON.parse(fenced ? fenced[1] : trimmed);
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

  try {
    return CareerProfileSchema.parse(extractJson(content));
  } catch {
    throw new OpenRouterError("OpenRouter returned invalid profile JSON.");
  }
}
