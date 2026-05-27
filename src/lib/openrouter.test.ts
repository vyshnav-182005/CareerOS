import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeResumeWithOpenRouter, generateProjectSummaries, OpenRouterError } from "./openrouter";
import type { ResumeSections } from "./sections";

const sections: ResumeSections = {
  summary: "Full-stack engineer",
  skills: "React, TypeScript",
  experience: "",
  projects: "",
  education: "",
  certifications: "",
  links: "",
  other: ""
};

describe("analyzeResumeWithOpenRouter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("classifies provider transport failures as OpenRouter errors", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));

    await expect(analyzeResumeWithOpenRouter("SUMMARY\nFull-stack engineer", sections)).rejects.toBeInstanceOf(
      OpenRouterError
    );
  });

  it("classifies non-json provider bodies as OpenRouter errors", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>Provider unavailable</html>", { status: 200 }))
    );

    await expect(analyzeResumeWithOpenRouter("SUMMARY\nFull-stack engineer", sections)).rejects.toBeInstanceOf(
      OpenRouterError
    );
  });
});

describe("generateProjectSummaries", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("asks the LLM for detailed project bullets that explain the project crux", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    title: "career-os",
                    techStack: ["TypeScript", "Next.js", "React"],
                    atsPoints: [
                      "Built a detailed AI career profile workflow that turns resume and GitHub data into structured project evidence for recruiter-facing review."
                    ]
                  }
                ])
              }
            }
          ]
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateProjectSummaries([
      {
        name: "career-os",
        description: "AI career profile builder",
        language: "TypeScript",
        topics: ["nextjs", "ats"],
        url: "https://github.com/vyshn/career-os",
        stars: 12
      }
    ]);

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const prompt = requestBody.messages[1].content;

    expect(prompt).toContain("detailed, ATS-friendly bullet points");
    expect(prompt).toContain("clearly explain the crux of each project");
    expect(prompt).toContain("Each bullet should be 22-35 words");
    expect(prompt).toContain("core problem, user need, or workflow");
    expect(prompt).toContain("main system design, architecture, modules, or data flow");
    expect(prompt).toContain('"techStack"');
    expect(prompt).toContain("Return a normalized techStack array");
  });
});
