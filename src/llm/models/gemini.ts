import { GenerateContentConfig, GoogleGenAI } from "@google/genai";

import { TokenUsage } from "@llm/logger";
import { ChatMessage, JSONSchema } from "@llm/types";

import { BaseLLMAdapter } from "./baseLLM";

export class GeminiAdapter extends BaseLLMAdapter {
	private client: GoogleGenAI;

	constructor(apiKey: string, model = "gemini-2.5-flash") {
		super(model, "gemini");
		this.client = new GoogleGenAI({ apiKey });
	}

	async executeChat(
		messages: ChatMessage[],
		schema?: JSONSchema
	): Promise<{ content: string; tokenUsage?: TokenUsage }> {
		const systemMessage = messages.find((m) => m.role === "system");
		let otherMessages = messages.filter((m) => m.role !== "system");
		if (otherMessages.length === 0) {
			otherMessages = [{ role: "user", content: "Начни." }];
		}

		const config: GenerateContentConfig = {
			systemInstruction: systemMessage?.content,
		};

		// Add JSON Schema if provided
		if (schema) {
			config.responseMimeType = "application/json";
			config.responseSchema = schema;
		}

		const response = await this.client.models.generateContent({
			model: this.model,
			contents: otherMessages.map((m) => ({
				role: m.role === "assistant" ? "model" : "user",
				parts: [{ text: m.content }],
			})),
			config,
		});

		const content = response.text ?? "";

		// Extract token usage
		const tokenUsage = response.usageMetadata
			? {
					totalTokens:
						(response.usageMetadata.promptTokenCount || 0) +
						(response.usageMetadata.candidatesTokenCount || 0),
					inputTokens: response.usageMetadata.promptTokenCount,
					outputTokens: response.usageMetadata.candidatesTokenCount,
				}
			: undefined;

		return { content, tokenUsage };
	}
}
