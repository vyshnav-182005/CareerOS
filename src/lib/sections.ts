export type ResumeSectionName =
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "links"
  | "other";

export type ResumeSections = Record<ResumeSectionName, string>;
import { normalizeTextBlock } from "./text";

const headingMap: Array<[ResumeSectionName, RegExp]> = [
  ["summary", /^(summary|profile|objective|about)$/i],
  ["skills", /^(skills|technical skills|technologies|tools)$/i],
  ["experience", /^(experience|work experience|employment|professional experience)$/i],
  ["projects", /^(projects|selected projects|academic projects)$/i],
  ["education", /^(education|academics|academic background)$/i],
  ["certifications", /^(certifications|certificates|licenses)$/i],
  ["links", /^(links|profiles|portfolio)$/i]
];

const emptySections = (): ResumeSections => ({
  summary: "",
  skills: "",
  experience: "",
  projects: "",
  education: "",
  certifications: "",
  links: "",
  other: ""
});

export function detectResumeSections(text: string): ResumeSections {
  const sections = emptySections();
  let current: ResumeSectionName = "other";
  let lastLine = "";

  for (const rawLine of text.split(/\r?\n/)) {
    const line = normalizeTextBlock(rawLine);
    if (!line) continue;

    const matched = headingMap.find(([, pattern]) => pattern.test(line));
    if (matched) {
      current = matched[0];
      lastLine = "";
      continue;
    }

    if (line === lastLine) {
      continue;
    }

    sections[current] = [sections[current], line].filter(Boolean).join("\n");
    lastLine = line;
  }

  if (!Object.values(sections).some(Boolean)) {
    sections.other = normalizeTextBlock(text);
  }

  return sections;
}
