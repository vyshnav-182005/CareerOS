import fs from "fs";
import mongoose from "mongoose";

async function fix() {
  const envContent = fs.readFileSync(".env", "utf-8");
  const uriMatch = envContent.match(/MONGODB_URI=(.*)/);
  if (!uriMatch) throw new Error("No MONGODB_URI in .env");
  const uri = uriMatch[1].trim();

  await mongoose.connect(uri);
  
  const user = await mongoose.connection.db.collection('users').findOne({});
  if (!user) {
    console.log("No user found");
    process.exit(1);
  }

  const result = await mongoose.connection.db.collection('careerprofiles').updateMany(
    {},
    { $set: { userId: user._id } }
  );

  console.log(`Updated ${result.modifiedCount} profiles to belong to user ${user._id}`);
  mongoose.disconnect();
}
fix();
