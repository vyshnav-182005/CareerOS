import { NextRequest, NextResponse } from "next/server";

async function getSkillSuggestionsFromLLM(query: string): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not configured");
    return [];
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            content: `You are a technical skills suggestion assistant for developers and engineers.
Your job is to expand abbreviations and suggest related technical skills.

IMPORTANT:
- Expand ALL abbreviations: ML=Machine Learning, MCP=Model Context Protocol, CI/CD=Continuous Integration/Continuous Deployment, etc.
- Include the expanded form in results
- Suggest related technologies and frameworks
- Accept: programming languages, frameworks, tools, protocols, methodologies, platforms, cloud services, databases
- Return ONLY a JSON array of 3-6 skill suggestions as strings
- Format: ["Skill1", "Skill2", "Skill3"]
- NO markdown, NO extra text, ONLY the JSON array

Examples:
- "ML" → ["Machine Learning", "TensorFlow", "PyTorch", "scikit-learn"]
- "MCP" → ["Model Context Protocol", "AI Protocols", "LLM Integration"]
- "DevOps" → ["Docker", "Kubernetes", "CI/CD", "Infrastructure as Code"]`
          },
          {
            role: "user",
            content: `Suggest technical skills related to: "${query}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error("OpenRouter error:", response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return [];
    }

    // Parse the JSON array from response
    const parsed = JSON.parse(content.trim());
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (skill): skill is string =>
          typeof skill === "string" && skill.trim().length > 0
      );
    }

    return [];
  } catch (error) {
    console.error("Skill suggestion error:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const suggestions = await getSkillSuggestionsFromLLM(query);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
