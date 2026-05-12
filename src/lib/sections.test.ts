import { describe, expect, it } from "vitest";
import { detectResumeSections } from "./sections";

describe("detectResumeSections", () => {
  it("groups common resume headings", () => {
    const text = `SUMMARY
Full-stack engineer

SKILLS
React, TypeScript, Node.js

PROJECTS
CareerOS - Resume parser

EDUCATION
B.Tech Computer Science`;

    const sections = detectResumeSections(text);

    expect(sections.summary).toContain("Full-stack engineer");
    expect(sections.skills).toContain("React");
    expect(sections.projects).toContain("CareerOS");
    expect(sections.education).toContain("B.Tech");
  });

  it("keeps unknown content in other", () => {
    const sections = detectResumeSections("Awards\nWinner of coding challenge");

    expect(sections.other).toContain("Winner of coding challenge");
  });

  it("drops duplicate and decorative lines", () => {
    const sections = detectResumeSections(`PROJECTS
Sentinel Turret Rover: AI-Based Intruder Defense System §
Sentinel Turret Rover: AI-Based Intruder Defense System §
• Developed a computer vision-driven autonomous rover
• Developed a computer vision-driven autonomous rover`);

    expect(sections.projects).toContain("Sentinel Turret Rover: AI-Based Intruder Defense System");
    expect(sections.projects).not.toContain("§");

    const lines = sections.projects.split("\n").filter(Boolean);
    expect(lines).toHaveLength(2);
  });
});
