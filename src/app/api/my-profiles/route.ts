import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth-options";
import { connectDB } from "../../../lib/mongodb";
import { CareerProfileModel } from "../../../models/career-profile";
import { User } from "../../../models/user";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("[my-profiles] Session:", JSON.stringify(session, null, 2));

    if (!session?.user) {
      console.warn("[my-profiles] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    console.log("[my-profiles] userId from session:", userId, "type:", typeof userId);

    if (!userId) {
      console.warn("[my-profiles] No userId in session");
      return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    await connectDB();

    const dbName = mongoose.connection.db?.databaseName;
    console.log("[my-profiles] Connected to database:", dbName);

    // Ensure userId is properly cast to ObjectId for the query
    const objectId = new mongoose.Types.ObjectId(userId);
    const sessionEmail = session.user.email?.trim();

    if (sessionEmail) {
      const emailMatcher = new RegExp(`^${escapeRegExp(sessionEmail)}$`, "i");
      const legacyProfileUserIds = await CareerProfileModel.distinct("userId", {
        email: emailMatcher,
        userId: { $ne: objectId },
      });
      const existingUserIds = await User.distinct("_id", {
        _id: { $in: legacyProfileUserIds },
      });
      const existingUserIdSet = new Set(existingUserIds.map((id) => id.toString()));
      const orphanUserIds = legacyProfileUserIds.filter(
        (id) => !existingUserIdSet.has(id.toString())
      );

      await CareerProfileModel.updateMany(
        {
          email: emailMatcher,
          userId: { $in: orphanUserIds },
        },
        { $set: { userId: objectId } }
      );
    }

    const profiles = await CareerProfileModel.find({ userId: objectId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[my-profiles] Fetched ${profiles.length} profiles for user ${userId}`);

    return NextResponse.json({
      success: true,
      profiles: profiles || [],
      count: profiles?.length || 0,
    });
  } catch (error) {
    console.error("[my-profiles] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch profiles.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
