import { ChatOpenAI } from "@langchain/openai";

export function getOpenRouterChatModel(temperature = 0.2): ChatOpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  const siteUrl = process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000";
  const siteName = process.env.OPENROUTER_SITE_NAME ?? "CareerOS";

  return new ChatOpenAI({
    apiKey,
    model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4-mini",
    temperature,
    configuration: {
      baseURL,
      defaultHeaders: {
        "HTTP-Referer": siteUrl,
        "X-Title": siteName
      }
    }
  });
}
