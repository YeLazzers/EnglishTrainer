import { LLMAdapter } from "./types";
import { GeminiAdapter } from "./gemini";
import { OpenAIAdapter } from "./openai";

export type LLMProvider = "gemini" | "openai";

export function createLLM(): LLMAdapter {
  const provider = (process.env.LLM_PROVIDER || "gemini") as LLMProvider;

  switch (provider) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
      return new GeminiAdapter(apiKey);
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
      return new OpenAIAdapter(apiKey);
    }
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

export type { LLMAdapter, ChatMessage } from "./types";
