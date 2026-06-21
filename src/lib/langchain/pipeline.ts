import { createJobSearchChain, createProfileSummarizerChain, createResumeBuilderChain } from "./agents";
import type { JobSearchAgentInput, ProfileSummarizerInput, ResumeBuilderInput } from "./agents";
import type { JobSearchResult, ProfileSummary, ResumeData } from "./schemas";

export async function runProfileSummaryPipeline(
  input: ProfileSummarizerInput
): Promise<ProfileSummary> {
  const chain = createProfileSummarizerChain();
  return chain.invoke(input);
}

export async function runJobSearchPipeline(
  input: JobSearchAgentInput
): Promise<JobSearchResult> {
  const chain = createJobSearchChain();
  return chain.invoke(input);
}

export async function runResumeBuilderPipeline(
  input: ResumeBuilderInput
): Promise<ResumeData> {
  const chain = createResumeBuilderChain();
  return chain.invoke(input);
}
