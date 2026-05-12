import { NextResponse } from "next/server";
import { analyzeResumeWithOpenRouter, OpenRouterError } from "../../../lib/openrouter";
import { extractTextFromPdf, ResumePdfError } from "../../../lib/pdf";
import { detectResumeSections } from "../../../lib/sections";

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
    const profile = await analyzeResumeWithOpenRouter(rawText, sections);

    return NextResponse.json({ rawText, sections, profile });
  } catch (error) {
    if (error instanceof ResumePdfError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    if (error instanceof OpenRouterError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
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
