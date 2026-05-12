import { describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/pdf", () => ({
  ResumePdfError: class ResumePdfError extends Error {
    constructor(message: string, public readonly code: string) {
      super(message);
    }
  },
  extractTextFromPdf: vi.fn(async () => "SUMMARY\nDeveloper\nSKILLS\nReact")
}));

vi.mock("../../../lib/openrouter", () => ({
  OpenRouterError: class OpenRouterError extends Error {},
  analyzeResumeWithOpenRouter: vi.fn(async () => ({
    candidate: { name: "Asha", headline: null, contacts: [], location: null, links: [] },
    executiveSummary: "Developer",
    explicitSkills: [],
    inferredSkills: [],
    technicalDepth: [],
    experience: [],
    projects: [],
    education: [],
    roleAlignment: [],
    strengths: [],
    gaps: [],
    recommendations: [],
    evidence: []
  }))
}));

import { POST } from "./route";

describe("POST /api/parse-resume", () => {
  it("returns profile and detected sections", async () => {
    const form = new FormData();
    form.append("resume", new File(["%PDF"], "resume.pdf", { type: "application/pdf" }));

    const response = await POST(
      new Request("http://localhost/api/parse-resume", { method: "POST", body: form })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.executiveSummary).toBe("Developer");
    expect(body.sections.summary).toContain("Developer");
  });
});
