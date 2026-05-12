import { describe, expect, it } from "vitest";
import { CareerProfileSchema } from "./profile-schema";

describe("CareerProfileSchema", () => {
  it("accepts a complete profile with explicit and inferred evidence", () => {
    const profile = CareerProfileSchema.parse({
      candidate: {
        name: "Asha Kumar",
        headline: "Full-stack developer",
        contacts: ["asha@example.com"],
        location: "Bengaluru",
        links: ["https://github.com/asha"]
      },
      executiveSummary: "Full-stack developer with product experience.",
      explicitSkills: [{ name: "React", evidence: "Skills: React" }],
      inferredSkills: [
        {
          name: "API design",
          confidence: "medium",
          rationale: "Built REST services for projects.",
          evidence: "Project: REST API"
        }
      ],
      technicalDepth: [
        {
          area: "Frontend",
          level: "intermediate",
          rationale: "React and state management experience.",
          evidence: "React, Redux"
        }
      ],
      experience: [],
      projects: [],
      education: [],
      roleAlignment: [
        {
          role: "Frontend Engineer",
          score: 82,
          rationale: "Strong React evidence.",
          strengths: ["React"],
          gaps: ["Testing depth"]
        }
      ],
      strengths: [{ title: "Product delivery", evidence: "Launched app" }],
      gaps: [{ title: "Cloud depth", recommendation: "Add deployment details" }],
      recommendations: ["Quantify project impact."],
      evidence: [{ id: "skills-1", section: "skills", snippet: "React" }]
    });

    expect(profile.roleAlignment[0].score).toBe(82);
  });

  it("normalizes fractional role alignment scores to a 0-100 scale", () => {
    const profile = CareerProfileSchema.parse({
      candidate: {
        name: null,
        headline: null,
        contacts: [],
        location: null,
        links: []
      },
      executiveSummary: "Summary",
      explicitSkills: [],
      inferredSkills: [],
      technicalDepth: [],
      experience: [],
      projects: [],
      education: [],
      roleAlignment: [
        {
          role: "AI/ML Engineer",
          score: 0.92,
          rationale: "Strong evidence of applied AI work.",
          strengths: [],
          gaps: []
        }
      ],
      strengths: [],
      gaps: [],
      recommendations: [],
      evidence: []
    });

    expect(profile.roleAlignment[0].score).toBe(92);
  });
});
