import { z } from "zod";

const EvidenceString = z.string().min(1);
const RoleAlignmentScoreSchema = z.preprocess((value) => {
  if (typeof value !== "number") {
    return value;
  }

  if (value > 0 && value <= 1) {
    return Math.round(value * 100);
  }

  return Math.round(value);
}, z.number().int().min(0).max(100));

export const SkillSchema = z.object({
  name: z.string().min(1),
  evidence: EvidenceString.optional().catch(undefined)
});

export const InferredSkillSchema = z.object({
  name: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
  rationale: z.string().min(1).optional().catch(undefined),
  evidence: EvidenceString.optional().catch(undefined)
});

export const TechnicalDepthSchema = z.object({
  area: z.string().min(1),
  level: z.string()
    .transform((val) => typeof val === "string" ? val.trim().toLowerCase() : val)
    .pipe(z.enum(["foundational", "intermediate", "advanced", "expert"])),
  rationale: z.string().min(1).optional().catch(undefined),
  evidence: EvidenceString.optional().catch(undefined)
});



export const ExperienceSchema = z.object({
  title: z.string().nullable(),
  organization: z.string().nullable(),
  dates: z.string().nullable(),
  summary: z.string().nullable(),
  outcomes: z.array(z.string()).default([]),
  inferredSeniority: z.string().nullable().optional().catch(null)
});

export const ProjectSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  technologies: z.array(z.string()).default([]),
  complexitySignals: z.array(z.string()).default([]),
  impact: z.string().nullable()
});

export const CareerProfileSchema = z.object({
  candidate: z.object({
    name: z.string().nullable(),
    headline: z.string().nullable(),
    contacts: z
      .union([z.array(z.string()), z.string()])
      .transform((val) => (typeof val === "string" ? (val ? [val] : []) : val))
      .default([]),
    location: z.string().nullable(),
    links: z
      .union([z.array(z.string()), z.string()])
      .transform((val) => {
        if (typeof val === "string") {
          return val ? [val] : [];
        }
        return val;
      })
      .default([])
  }).passthrough(),
  executiveSummary: z.string().optional().default(""),
  explicitSkills: z
    .array(
      z.object({
        name: z.string().min(1),
        evidence: z
          .string()
          .nullish()
          .transform((val) => (typeof val === "string" && val.length > 0 ? val : "Mentioned in resume"))
      })
    )
    .default([]),
  inferredSkills: z.array(InferredSkillSchema).default([]),
  technicalDepth: z.array(TechnicalDepthSchema).default([]),
  experience: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  education: z
    .array(
      z.object({
        institution: z.string().nullable(),
        credential: z.string().nullable(),
        dates: z.string().nullable(),
        details: z.array(z.string()).default([])
      })
    )
    .default([]),
  roleAlignment: z
    .array(
      z.object({
        role: z.string().min(1),
        score: RoleAlignmentScoreSchema,
        rationale: z.string().min(1).optional().catch(undefined),
        strengths: z.array(z.string()).default([]),
        gaps: z.array(z.string()).default([])
      })
    )
    .default([]),
  strengths: z.array(z.object({ title: z.string(), evidence: EvidenceString.optional().catch(undefined).transform((val) => (typeof val === "string" && val.length > 0 ? val : "Mentioned in resume")) })).default([]),
  gaps: z.array(z.object({ title: z.string(), recommendation: z.string() })).default([]),
  recommendations: z.array(z.string()).default([]),
  evidence: z
    .array(
      z.union([
        z.object({
          id: z.string().min(1),
          section: z.string().min(1),
          snippet: z.string().min(1)
        }),
        z.string().min(1).transform((snippet, ctx) => ({
          id: `evidence-${Math.random().toString(36).substring(7)}`,
          section: "unspecified",
          snippet
        }))
      ])
    )
    .default([])
}).passthrough();

export type CareerProfile = z.infer<typeof CareerProfileSchema>;
