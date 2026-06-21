import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { connectDB } from "../../../lib/mongodb";
import { CareerProfileModel } from "../../../models/career-profile";
import { runResumeBuilderPipeline } from "../../../lib/langchain";
import { generateResumeLatex, compileLatexToPdf } from "../../../lib/latex-template";
import mongoose from "mongoose";

// Helper for delaying retries
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profileId, jobDescription, jobTitle, companyName } = body;

    if (!profileId || !jobDescription || !jobTitle) {
      return NextResponse.json(
        { error: "profileId, jobDescription, and jobTitle are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch the career profile and verify ownership
    const objectId = new mongoose.Types.ObjectId(profileId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const profile = await CareerProfileModel.findOne({
      _id: objectId,
      userId: userObjectId,
    }).lean();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    console.log(
      "[build-resume] Building tailored resume for profile:",
      profileId,
      "| Job:",
      jobTitle,
      "at",
      companyName || "Unknown Company"
    );

    // Map MongoDB CareerProfile to the resume builder agent input
    const resumeInput = {
      fullName: profile.name || "",
      email: profile.email || "",
      phone: "",
      linkedin: profile.linkedin || "",
      github: profile.github
        ? (profile.github.startsWith("http")
            ? profile.github
            : `https://github.com/${profile.github}`)
        : "",
      website: "",
      skills: profile.skills ?? [],
      education: (profile.education ?? []).map((edu: any) => ({
        institution: edu.institution || "",
        degree: edu.degree || "",
        branch: edu.branch || "",
        dates: edu.dates || "",
        cgpa: edu.cgpa || "",
      })),
      experience: (profile.experience ?? []).map((exp: any) => ({
        title: exp.title || "",
        organization: exp.organization || "",
        dates: exp.dates || "",
        summary: exp.summary || "",
      })),
      projects: (profile.githubProjects ?? []).map((p: any) => ({
        title: p.title || "",
        description: p.description || "",
        techStack: [...(p.techStack ?? []), ...(p.topics ?? [])],
        atsPoints: p.atsPoints ?? [],
        url: p.url || "",
      })),
      jobTitle,
      companyName: companyName || "",
      jobDescription,
    };

    // Step 1: Run the LangChain resume builder pipeline with retries
    let resumeData;
    const MAX_RETRIES = 2;
    let attempt = 0;
    let llmSuccess = false;

    while (attempt <= MAX_RETRIES && !llmSuccess) {
      try {
        resumeData = await runResumeBuilderPipeline(resumeInput);
        llmSuccess = true;
      } catch (err: any) {
        attempt++;
        const isRateLimit = err?.status === 429 || err?.code === 429 || err?.message?.includes('429');
        if (isRateLimit && attempt <= MAX_RETRIES) {
          console.warn(`[build-resume] Rate limited (429). Retrying ${attempt}/${MAX_RETRIES} in 5 seconds...`);
          await delay(5000);
        } else {
          console.error(`[build-resume] Agent failed after ${attempt} attempts:`, err?.message || err);
          throw err;
        }
      }
    }
    console.log("[build-resume] Agent produced structured resume data");

    // Step 2: Generate LaTeX from the structured data
    const latex = generateResumeLatex(resumeData);
    console.log(
      `[build-resume] Generated LaTeX document (${latex.length} chars)`
    );

    // Step 3: Compile LaTeX to PDF via online API
    console.log("[build-resume] Compiling LaTeX to PDF...");
    const pdfBuffer = await compileLatexToPdf(latex);
    console.log(
      `[build-resume] PDF compiled successfully (${pdfBuffer.length} bytes)`
    );

    // Build a safe filename for the download
    const safeName = (companyName || "company")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const safeTitle = (jobTitle || "resume")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const filename = `resume_${safeName}_${safeTitle}.pdf`;

    // Return the PDF as a binary response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[build-resume] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to build resume.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

