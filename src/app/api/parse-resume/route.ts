import { NextResponse } from "next/server";
import { extractTextFromPdf, ResumePdfError } from "../../../lib/pdf";
import { detectResumeSections } from "../../../lib/sections";
import { CareerProfileSchema } from "../../../lib/profile-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a PDF resume to analyze." }, { status: 400 });
    }

    const rawText = await extractTextFromPdf(file);
    const sections = detectResumeSections(rawText);

    // Create basic profile from PDF without LLM analysis
    const profileData = {
      candidate: {
        name: null,
        headline: null,
        contacts: [],
        location: null,
        links: []
      },
      executiveSummary: sections.summary || "",
      explicitSkills: (sections.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((skill) => ({ name: skill, evidence: "Extracted from resume" })),
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
    };

    const profile = CareerProfileSchema.parse(profileData);

    return NextResponse.json({ rawText, sections, profile });
  } catch (error) {
    if (error instanceof ResumePdfError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    console.error("Unexpected resume analysis error", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Resume analysis failed. Try again with a text-based PDF." },
      { status: 500 }
    );
  }
}
