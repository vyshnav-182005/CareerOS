import mongoose from "mongoose";
import fs from "fs";

async function check() {
  const envContent = fs.readFileSync(".env", "utf-8");
  const uriMatch = envContent.match(/MONGODB_URI=(.*)/);
  if (!uriMatch) throw new Error("No MONGODB_URI in .env");
  const uri = uriMatch[1].trim();

  await mongoose.connect(uri);
  
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log("Users:");
  for (const u of users) {
    console.log(`  _id: ${u._id}, email: ${u.email}`);
  }
  
  const profiles = await mongoose.connection.db.collection('careerprofiles').find({}).toArray();
  console.log("\nProfiles:");
  for (const p of profiles) {
    console.log(`  _id: ${p._id}, userId: ${p.userId}, userIdType: ${typeof p.userId}, isObjectId: ${p.userId instanceof mongoose.Types.ObjectId}, email: ${p.email}`);
  }
  
  mongoose.disconnect();
}
check();
