import mongoose from "mongoose";

const JobPostingSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  remote: Boolean,
  employmentType: String,
  experienceLevel: String,
  description: String,
  requirements: [String],
  responsibilities: [String],
  skills: [String],
  technologies: [String],
  salaryRange: String,
  source: String,
  sourceUrl: String,
  postedAt: String,
  applicationUrl: String,
});

const JobSearchCacheSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    searchTerms: [String],
    targetRoles: [String],
    sources: [String],
    jobs: [JobPostingSchema],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 43200, // 12 hours in seconds
    },
  },
  { timestamps: true }
);

// Indexes for quick lookup
JobSearchCacheSchema.index({ userId: 1, profileId: 1 });

export const JobSearchCacheModel =
  mongoose.models.JobSearchCache ||
  mongoose.model("JobSearchCache", JobSearchCacheSchema);
