import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { connectDB } from "../../../lib/mongodb";
import { CareerProfileModel } from "../../../models/career-profile";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await request.json();

    const { formData, githubProjects } = body;

    if (!formData) {
      return NextResponse.json(
        { error: "formData is required." },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      github,
      linkedin,
      linkedIn,
      skills = [],
      interests = "",
      targetRoles = "",
      education = [],
      experience = [],
    } = formData;

    const linkedinUrl = linkedin || linkedIn;

    if (!name || !email || !github || !linkedinUrl) {
      return NextResponse.json(
        {
          error: "name, email, github, and linkedin are required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const doc = await CareerProfileModel.create({
      userId,
      name,
      email,
      github,
      linkedin: linkedinUrl,
      skills,
      interests,
      targetRoles,
      education,
      experience,
      githubProjects: githubProjects || [],
    });

    return NextResponse.json(
      {
        message: "Profile saved successfully.",
        profileId: doc._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save profile error:", error);
    return NextResponse.json(
      { error: "Failed to save profile. Please try again." },
      { status: 500 }
    );
  }
}
