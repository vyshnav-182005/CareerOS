import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IGitHubProject {
  title: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  techStack: string[];
  atsPoints: string[];
}

export interface ICareerProfile extends Document {
  userId: Types.ObjectId;
  name: string;
  email: string;
  github: string;
  linkedin: string;
  skills: string[];
  interests: string;
  targetRoles: string;
  education: Array<{
    institution: string;
    degree: string;
    branch: string;
    dates: string;
    cgpa?: string;
  }>;
  experience: Array<{
    title: string;
    organization: string;
    dates: string;
    summary: string;
  }>;
  githubProjects: IGitHubProject[];
  createdAt: Date;
  updatedAt: Date;
}

const GitHubProjectSchema = new Schema<IGitHubProject>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: null },
    language: { type: String, default: null },
    topics: [{ type: String }],
    stars: { type: Number, default: 0 },
    techStack: [{ type: String }],
    atsPoints: [{ type: String }],
  },
  { _id: false }
);

const CareerProfileSchema = new Schema<ICareerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    github: {
      type: String,
      required: true,
      trim: true,
    },
    linkedin: {
      type: String,
      required: true,
      trim: true,
    },
    skills: [{ type: String }],
    interests: {
      type: String,
      default: "",
    },
    targetRoles: {
      type: String,
      default: "",
    },
    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        branch: { type: String, required: true },
        dates: { type: String, required: true },
        cgpa: { type: String },
      },
    ],
    experience: [
      {
        title: { type: String, required: true },
        organization: { type: String, required: true },
        dates: { type: String, required: true },
        summary: { type: String, required: true },
      },
    ],
    githubProjects: {
      type: [GitHubProjectSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound index for efficient user profile queries
CareerProfileSchema.index({ userId: 1, createdAt: -1 });

export const CareerProfileModel =
  (mongoose.models.CareerProfile as mongoose.Model<ICareerProfile>) ||
  mongoose.model<ICareerProfile>("CareerProfile", CareerProfileSchema);
