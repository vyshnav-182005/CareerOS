import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { connectDB } from "../../../lib/mongodb";
import { CareerProfileModel } from "../../../models/career-profile";
import { JobSearchCacheModel } from "../../../models/job-search-cache";
import { runJobSearchPipeline } from "../../../lib/langchain";
import { fetchJSearchJobs } from "../../../lib/jsearch";
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
    const { profileId, forceRefresh } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const objectId = new mongoose.Types.ObjectId(profileId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Check Cache first (if not forcing a refresh)
    if (!forceRefresh) {
      const cached = await JobSearchCacheModel.findOne({
        userId: userObjectId,
        profileId: objectId,
      }).lean();

      if (cached) {
        console.log(`[job-search] Returning cached results for profile ${profileId}`);
        return NextResponse.json({
          success: true,
          searchTerms: cached.searchTerms ?? [],
          targetRoles: cached.targetRoles ?? [],
          sources: cached.sources ?? [],
          jobs: cached.jobs ?? [],
        });
      }
    }

    // 2. Fetch the career profile and verify ownership
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

    // Build candidate profile object
    const candidateProfile = {
      headline: profile.targetRoles || "",
      roleFocus: profile.targetRoles
        ? profile.targetRoles.split(",").map((r: string) => r.trim())
        : [],
      skillFocus: profile.skills ?? [],
      domainFocus: profile.interests
        ? profile.interests.split(",").map((i: string) => i.trim())
        : [],
      evidence: [],
      title: profile.targetRoles || "",
      summary: profile.interests || "",
      skills: profile.skills ?? [],
      experience: (profile.experience ?? []).map((exp) => ({
        title: exp.title,
        company: exp.organization,
      })),
      userProvided: {
        skills: profile.skills ?? [],
        interests: profile.interests
          ? profile.interests.split(",").map((i: string) => i.trim())
          : [],
        targetRoles: profile.targetRoles
          ? profile.targetRoles.split(",").map((r: string) => r.trim())
          : [],
        education: (profile.education ?? []).map((edu) => ({
          institution: edu.institution || "",
          credential: edu.degree || "",
          dates: edu.dates || "",
          details: edu.branch ? [edu.branch] : [],
        })),
        experience: (profile.experience ?? []).map((exp) => ({
          title: exp.title || "",
          organization: exp.organization || "",
          dates: exp.dates || "",
          summary: exp.summary || "",
        })),
      },
    };

    console.log(
      "[job-search] Running pipeline for profile:",
      profileId,
      "query hints:",
      candidateProfile.title,
      candidateProfile.skills.slice(0, 5)
    );

    const targetRoles = candidateProfile.userProvided?.targetRoles ?? [];
    const skills = candidateProfile.userProvided?.skills ?? [];

    const projects = (profile.githubProjects ?? []).map((p: any) => ({
      name: p.title || "",
      technologies: [...(p.techStack ?? []), ...(p.topics ?? [])],
      summary: p.description || "",
    }));

    // 3. Fetch Raw Jobs from JSearch directly
    const rawJobs = await fetchJSearchJobs(candidateProfile);
    
    let result;
    let finalJobs = [];
    
    // 4. Try LLM Pipeline with Retries
    const MAX_RETRIES = 2;
    let attempt = 0;
    let llmSuccess = false;

    while (attempt <= MAX_RETRIES && !llmSuccess) {
      try {
        result = await runJobSearchPipeline({
          candidateProfile,
          targetRoles,
          skills,
          projects,
          maxResults: 10,
          rawJobPostings: rawJobs,
        });
        llmSuccess = true;
      } catch (err: any) {
        attempt++;
        const isRateLimit = err?.status === 429 || err?.code === 429 || err?.message?.includes('429');
        if (isRateLimit && attempt <= MAX_RETRIES) {
          console.warn(`[job-search] Rate limited (429). Retrying ${attempt}/${MAX_RETRIES} in 5 seconds...`);
          await delay(5000);
        } else {
          console.error(`[job-search] LLM Pipeline failed after ${attempt} attempts:`, err?.message || err);
          break; // Break and use fallback
        }
      }
    }

    // 5. Fallback to Raw Jobs if LLM failed
    if (llmSuccess && result) {
      finalJobs = result.jobs ?? [];
    } else {
      console.log("[job-search] Falling back to deterministic sorting of raw JSearch jobs.");
      // Basic deterministic sorting (most recent first if postedAt is available)
      finalJobs = rawJobs.sort((a, b) => {
        const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 10);
      
      result = {
        searchTerms: targetRoles.length ? targetRoles : skills.slice(0, 3),
        targetRoles: targetRoles,
        sources: ["JSearch (Fallback)"],
        jobs: finalJobs,
      };
    }

    console.log(`[job-search] Pipeline returned ${finalJobs.length} jobs`);

    // 6. Save successful results to cache
    if (finalJobs.length > 0) {
      await JobSearchCacheModel.findOneAndUpdate(
        { userId: userObjectId, profileId: objectId },
        {
          searchTerms: result.searchTerms,
          targetRoles: result.targetRoles,
          sources: result.sources,
          jobs: finalJobs,
          createdAt: new Date(), // Reset TTL
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[job-search] Critical Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to search jobs.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

