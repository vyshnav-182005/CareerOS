import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import { CareerProfileModel } from "../../../models/career-profile";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    const knownUserId = "6a16c1da2f68ec3261c07395";

    // Test 1: Query with string
    const withString = await CareerProfileModel.find({ userId: knownUserId }).lean();

    // Test 2: Query with ObjectId
    const withObjectId = await CareerProfileModel.find({
      userId: new mongoose.Types.ObjectId(knownUserId),
    }).lean();

    // Test 3: Get all profiles
    const allProfiles = await CareerProfileModel.find({}).lean();

    return NextResponse.json({
      queryWithString: { count: withString.length, results: withString },
      queryWithObjectId: { count: withObjectId.length, results: withObjectId },
      allProfiles: { count: allProfiles.length, results: allProfiles },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
