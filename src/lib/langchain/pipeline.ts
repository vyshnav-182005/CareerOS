import { createProfileSummarizerChain } from "./agents";
import type { ProfileSummarizerInput } from "./agents";
import type { ProfileSummary } from "./schemas";

export async function runProfileSummaryPipeline(
  input: ProfileSummarizerInput
): Promise<ProfileSummary> {
  const chain = createProfileSummarizerChain();
  return chain.invoke(input);
}
