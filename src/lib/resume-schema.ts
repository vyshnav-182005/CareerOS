import { z } from "zod";

/**
 * Zod schema for the structured resume output produced by the
 * Resume Builder LangChain agent.  Every field maps 1-to-1 onto a
 * section in Jake's Resume LaTeX template.
 */

export const ResumeContactInfoSchema = z.object({
  name: z.string().min(1),
  email: z.string().default(""),
  phone: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
  website: z.string().default(""),
});

export const ResumeEducationSchema = z.object({
  institution: z.string().min(1),
  location: z.string().default(""),
  degree: z.string().min(1),
  dates: z.string().default(""),
  gpa: z.string().default(""),
  highlights: z.array(z.string()).default([]),
});

export const ResumeExperienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().default(""),
  dates: z.string().default(""),
  bullets: z.array(z.string()).default([]),
});

export const ResumeProjectSchema = z.object({
  name: z.string().min(1),
  technologies: z.string().default(""),
  bullets: z.array(z.string()).default([]),
});

export const ResumeSkillCategorySchema = z.object({
  category: z.string().min(1),
  skills: z.string().min(1),
});

export const ResumeDataSchema = z.object({
  contactInfo: ResumeContactInfoSchema,
  education: z.array(ResumeEducationSchema).default([]),
  experience: z.array(ResumeExperienceSchema).default([]),
  projects: z.array(ResumeProjectSchema).default([]),
  technicalSkills: z.array(ResumeSkillCategorySchema).default([]),
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type ResumeContactInfo = z.infer<typeof ResumeContactInfoSchema>;
export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;
export type ResumeExperience = z.infer<typeof ResumeExperienceSchema>;
export type ResumeProject = z.infer<typeof ResumeProjectSchema>;
export type ResumeSkillCategory = z.infer<typeof ResumeSkillCategorySchema>;
