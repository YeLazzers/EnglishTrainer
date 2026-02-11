import { GoogleGenAI } from "@google/genai";
import { ChatMessage, LLMAdapter } from "./types";

export class GeminiAdapter implements LLMAdapter {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model = "gemini-2.5-flash") {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const systemMessage = messages.find((m) => m.role === "system");
    let otherMessages = messages.filter((m) => m.role !== "system");
    if (otherMessages.length === 0) {
      otherMessages = [{ role: "user", content: "Начни." }];
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: otherMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: systemMessage?.content,
      },
    });

    return response.text ?? "";
  }
}
