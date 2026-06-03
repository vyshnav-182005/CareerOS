import { NextResponse } from "next/server";
import { CareerProfileSchema } from "../../../lib/profile-schema";
import { connectDB } from "../../../lib/mongodb";
import { CareerProfileModel } from "../../../models/career-profile";
import { fetchGitHubUserProjects } from "../../../lib/github";
import { generateProjectSummaries } from "../../../lib/openrouter";
import { runProfileSummaryPipeline } from "../../../lib/langchain";
import mongoose from "mongoose";

export const runtime = "nodejs";

type GitHubProjectSummary = {
  title: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  techStack: string[];
  atsPoints: string[];
};

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    // Validate required fields
    if (!formData.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!formData.email?.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!formData.github?.trim()) {
      return NextResponse.json(
        { error: "GitHub URL is required." },
        { status: 400 }
      );
    }

    if (!formData.linkedin?.trim() && !formData.linkedIn?.trim()) {
      return NextResponse.json(
        { error: "LinkedIn URL is required." },
        { status: 400 }
      );
    }

    // Parse skills (comes as array from form)
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

    // Build the profile for display purposes (without rationale and evidence)
    const linkedinUrl = formData.linkedin || formData.linkedIn || "";
    const links = [];
    if (formData.email?.trim()) {
      links.push(formData.email.trim());
    }
    if (linkedinUrl?.trim()) {
      links.push(linkedinUrl.trim());
    }
    if (formData.github?.trim()) {
      links.push(formData.github.trim());
    }

    const experience = Array.isArray(formData.experience)
      ? formData.experience
      : [];

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
      })),
      inferredSkills: interests.map((interest: string) => ({
        name: interest,
        confidence: "medium" as const,
      })),
      technicalDepth: [],
      experience: experience.map((item: any) => ({
        title: typeof item?.title === "string" ? item.title : null,
        organization: typeof item?.organization === "string" ? item.organization : null,
        dates: typeof item?.dates === "string" ? item.dates : null,
        summary: typeof item?.summary === "string" ? item.summary : null,
        outcomes: []
      })),
      projects: [],
      education: (formData.education || []).map((edu: any) => ({
        institution: edu.institution || null,
        credential: `${edu.degree}${edu.branch ? ` in ${edu.branch}` : ""}`,
        dates: edu.dates || null,
        details: edu.cgpa ? [`CGPA: ${edu.cgpa}`] : []
      })),
      roleAlignment: targetRoles.map((role: string) => ({
        role: role,
        score: 70,
        strengths: [],
        gaps: []
      })),
      strengths: [],
      gaps: [],
      recommendations: [],
      evidence: []
    };

    // Validate display profile with schema
    const displayProfile = CareerProfileSchema.parse(profileData);

    // Connect to database and save simplified profile
    await connectDB();

    // Generate a valid MongoDB ObjectId for userId if not provided
    // In production, this should come from NextAuth session
    const userId = formData.userId
      ? new mongoose.Types.ObjectId(formData.userId)
      : new mongoose.Types.ObjectId();

    // Fetch GitHub projects
    let githubProjects: GitHubProjectSummary[] = [];
    try {
      const username = extractGitHubUsername(formData.github);
      if (username) {
        const projects = await fetchGitHubUserProjects(username);
        
        if (projects.length > 0) {
          const projectsForLLM = projects.map((project) => ({
            name: project.name,
            url: project.url,
            description: project.description || "No description provided",
            readme: project.readme,
            language: project.language || "Not specified",
            stars: project.stars,
            topics: project.topics,
            detectedTech: project.detectedTech
          }));

          const summaries = await generateProjectSummaries(projectsForLLM);
          const projectsByName = new Map(projects.map((project) => [project.name, project]));
          
          githubProjects = summaries.map((summary) => {
            const project = projectsByName.get(summary.title);
            return {
              title: summary.title,
              url: project?.url ?? "",
              description: project?.description ?? null,
              language: project?.language ?? null,
              topics: project?.topics ?? [],
              stars: project?.stars ?? 0,
              techStack: mergeTechStack(project?.detectedTech ?? [], summary.techStack),
              atsPoints: summary.atsPoints
            };
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch GitHub projects:", error);
      // Continue without projects if fetch fails
    }

    let profileSummary = undefined;
    try {
      profileSummary = await runProfileSummaryPipeline({
        profile: displayProfile,
        githubProjects: githubProjects.map((project) => ({
          title: project.title,
          description: project.description,
          techStack: project.techStack,
          atsPoints: project.atsPoints
        }))
      });
    } catch (error) {
      console.error("Profile summary generation failed:", error);
    }

    // Upsert: Update if exists (same name and userId), create if new
    const careerProfile = await CareerProfileModel.findOneAndUpdate(
      { userId, name: formData.name },
      {
        userId,
        name: formData.name,
        email: formData.email,
        github: formData.github,
        linkedin: linkedinUrl,
        skills,
        interests: formData.interests || "",
        targetRoles: formData.targetRoles || "",
        education: formData.education || [],
        experience: formData.experience || [],
        githubProjects,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      profile: displayProfile,
      profileId: careerProfile._id,
      githubProjects,
      profileSummary,
      message: "Profile saved to database successfully",
    });
  } catch (error) {
    console.error("Profile creation error", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to create profile. Please try again." },
      { status: 500 }
    );
  }
}

function mergeTechStack(primary: string[], secondary: string[]): string[] {
  const normalized = new Map<string, string>();

  for (const tech of [...primary, ...secondary]) {
    const trimmed = tech.trim();
    if (!trimmed) continue;
    normalized.set(trimmed.toLowerCase(), trimmed);
  }

  return Array.from(normalized.values());
}

function extractGitHubUsername(githubUrl: string): string | null {
  try {
    // Handle URLs like https://github.com/username or https://github.com/username/
    const match = githubUrl.match(/github\.com\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
