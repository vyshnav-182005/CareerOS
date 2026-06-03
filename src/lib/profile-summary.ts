import { z } from "zod";

export const ProfileSummarySchema = z.object({
  headline: z.string().default(""),
  roleFocus: z.array(z.string()).default([]),
  skillFocus: z.array(z.string()).default([]),
  domainFocus: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  userProvided: z
    .object({
      skills: z.array(z.string()).default([]),
      interests: z.array(z.string()).default([]),
      targetRoles: z.array(z.string()).default([]),
      education: z
        .array(
          z.object({
            institution: z.string().nullable().default(""),
            credential: z.string().nullable().default(""),
            dates: z.string().nullable().default(""),
            details: z.array(z.string()).default([])
          })
        )
        .default([]),
      experience: z
        .array(
          z.object({
            title: z.string().nullable().default(""),
            organization: z.string().nullable().default(""),
            dates: z.string().nullable().default(""),
            summary: z.string().nullable().default("")
          })
        )
        .default([])
    })
    .default({
      skills: [],
      interests: [],
      targetRoles: [],
      education: [],
      experience: []
    })
});

export type ProfileSummary = z.infer<typeof ProfileSummarySchema>;
