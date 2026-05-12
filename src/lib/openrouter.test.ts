import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeResumeWithOpenRouter, OpenRouterError } from "./openrouter";
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
