import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import type { CareerProfile } from "../../profile-schema";
import { ProfileSummarySchema } from "../schemas";
import { getOpenRouterChatModel } from "../llm";

export type ProfileSummaryProject = {
  title: string;
  description: string | null;
  techStack: string[];
  atsPoints: string[];
};

export type ProfileSummarizerInput = {
  profile: CareerProfile;
  githubProjects?: ProfileSummaryProject[];
};

export function createProfileSummarizerChain() {
  const parser = StructuredOutputParser.fromZodSchema(ProfileSummarySchema);
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Return only valid JSON. No markdown unless required by the user."
    ],
    [
      "human",
      "You are a profile summarizer agent. Convert the full profile into a concise, structured skill and role summary for search and resume generation.\n\n" +
        "CRITICAL RULES:\n" +
        "1. Return ONLY valid JSON. No markdown backticks, no extra text.\n" +
        "2. Never use null values. Use empty strings \"\" or empty arrays [] instead.\n" +
        "3. Do not invent facts, dates, roles, employers, or metrics.\n" +
        "4. Use the GitHub project data to infer skills or role focus when supported by evidence.\n\n" +
        "Return ONLY valid JSON in this exact format:\n" +
        "{\n" +
        "  \"headline\": \"1-2 sentences max\",\n" +
        "  \"roleFocus\": [\"Role 1\", \"Role 2\"],\n" +
        "  \"skillFocus\": [\"Skill 1\", \"Skill 2\"],\n" +
        "  \"domainFocus\": [\"Domain 1\", \"Domain 2\"],\n" +
        "  \"evidence\": [\"Short evidence snippets tied to resume or GitHub projects\"],\n" +
        "  \"userProvided\": {\n" +
        "    \"skills\": [\"Skill from user input\"],\n" +
        "    \"interests\": [\"Interest from user input\"],\n" +
        "    \"targetRoles\": [\"Target role from user input\"],\n" +
        "    \"education\": [\n" +
        "      {\n" +
        "        \"institution\": \"string or empty\",\n" +
        "        \"credential\": \"string or empty\",\n" +
        "        \"dates\": \"string or empty\",\n" +
        "        \"details\": [\"detail\"]\n" +
        "      }\n" +
        "    ],\n" +
        "    \"experience\": [\n" +
        "      {\n" +
        "        \"title\": \"string or empty\",\n" +
        "        \"organization\": \"string or empty\",\n" +
        "        \"dates\": \"string or empty\",\n" +
        "        \"summary\": \"string or empty\"\n" +
        "      }\n" +
        "    ]\n" +
        "  }\n" +
        "}\n\n" +
        "Required coverage rules:\n" +
        "- Copy ALL user-entered details into userProvided (do not omit or rephrase).\n" +
        "- Use GitHub projects to infer deeper capabilities (e.g., RAG chatbot work => \"RAG\" and \"LLM applications\" in skillFocus/domainFocus).\n" +
        "- If information is missing, use empty strings/arrays, never null.\n\n" +
        "Profile data:\n{profile}\n\n" +
        "GitHub projects:\n{githubProjects}"
    ]
  ]);

  const model = getOpenRouterChatModel(0.2);

  return RunnableSequence.from([
    (input: ProfileSummarizerInput) => ({
      profile: JSON.stringify(input.profile, null, 2),
      githubProjects: JSON.stringify(input.githubProjects ?? [], null, 2)
    }),
    prompt,
    model,
    parser
  ]);
}
