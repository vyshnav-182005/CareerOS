import { NextResponse } from "next/server";
import { CareerProfileSchema } from "../../../lib/profile-schema";
import type { ResumeSections } from "../../../lib/sections";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    // Validate required fields
    if (!formData.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    // Parse skills (comes as array from form) and interests
    const skills = Array.isArray(formData.skills)
      ? formData.skills
      : formData.skills
          ?.split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0) || [];

    const interests = formData.interests
      ?.split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0) || [];

    const targetRoles = formData.targetRoles
      ?.split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0) || [];

    // Build the profile
    const links = [];
    if (formData.email?.trim()) {
      links.push(formData.email.trim());
    }
    if (formData.linkedIn?.trim()) {
      links.push(formData.linkedIn.trim());
    }
    if (formData.github?.trim()) {
      links.push(formData.github.trim());
    }

    const profileData = {
      candidate: {
        name: formData.name || null,
        headline: targetRoles.length > 0 ? `Interested in: ${targetRoles.join(", ")}` : null,
        contacts: formData.email ? [formData.email] : [],
        location: null,
        links: links
      },
      executiveSummary: "",
      explicitSkills: skills.map((skill: string) => ({
        name: skill,
        evidence: "Added by user"
      })),
      inferredSkills: interests.map((interest: string) => ({
        name: interest,
        confidence: "medium" as const,
        rationale: "User-specified interest",
        evidence: "Added by user"
      })),
      technicalDepth: [],
      experience: formData.experience.map((exp: any) => ({
        title: exp.title || null,
        organization: exp.organization || null,
        dates: exp.dates || null,
        summary: exp.summary || null,
        outcomes: [],
        inferredSeniority: null
      })),
      projects: [],
      education: formData.education.map((edu: any) => ({
        institution: edu.institution || null,
        credential: edu.credential || null,
        dates: edu.dates || null,
        details: []
      })),
      roleAlignment: targetRoles.map((role: string) => ({
        role: role,
        score: 70,
        rationale: "User-selected target role",
        strengths: [],
        gaps: []
      })),
      strengths: [],
      gaps: [],
      recommendations: [],
      evidence: []
    };

    // Validate with schema
    const profile = CareerProfileSchema.parse(profileData);

    // Create dummy sections (since we're not parsing a PDF)
    const sections: ResumeSections = {
      summary: "",
      experience: formData.experience
        .map(
          (exp: any) =>
            `${exp.title} at ${exp.organization} (${exp.dates})\n${exp.summary}`
        )
        .join("\n\n"),
      education: formData.education
        .map(
          (edu: any) =>
            `${edu.credential} from ${edu.institution} (${edu.dates})`
        )
        .join("\n"),
      skills: skills.join(", "),
      projects: "",
      certifications: "",
      links: "",
      other: ""
    };

    // Create rawText representation
    const rawText = [
      formData.name,
      formData.email,
      formData.location,
      "",
      "PROFESSIONAL SUMMARY",
      formData.executiveSummary,
      "",
      "SKILLS",
      skills.join(", "),
      "",
      "EXPERIENCE",
      formData.experience
        .map(
          (exp: any) =>
            `${exp.title} at ${exp.organization}\n${exp.dates}\n${exp.summary}`
        )
        .join("\n\n"),
      "",
      "EDUCATION",
      formData.education
        .map(
          (edu: any) =>
            `${edu.credential} from ${edu.institution} (${edu.dates})`
        )
        .join("\n"),
      "",
      "INTERESTS",
      interests.join(", "),
      "",
      "TARGET ROLES",
      targetRoles.join(", ")
    ].join("\n");

    return NextResponse.json({ rawText, sections, profile });
  } catch (error) {
    console.error("Profile creation error", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof Error && error.message.includes("parsing")) {
      return NextResponse.json(
        { error: "Invalid profile data. Please check your entries." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Profile creation failed. Please try again." },
      { status: 500 }
    );
  }
}
