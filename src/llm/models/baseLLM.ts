import { logLLMInteraction, TokenUsage } from "@llm/logger";
import { ChatMessage, LLMAdapter, JSONSchema } from "@llm/types";

export abstract class BaseLLMAdapter implements LLMAdapter {
	protected model: string;
	protected providerName: string;

	constructor(model: string, providerName: string) {
		this.model = model;
		this.providerName = providerName;
	}

	abstract executeChat(
		messages: ChatMessage[],
		schema?: JSONSchema
	): Promise<{ content: string; tokenUsage?: TokenUsage }>;

	async chat(messages: ChatMessage[], schema?: JSONSchema): Promise<string> {
		// Get last message for logging
		const lastMessage = messages[messages.length - 1];
		const prompt = lastMessage.content.substring(0, 20);

		console.log(`[LLM:${this.providerName}] Initiating request: "${prompt}..."`);

		try {
			const { content, tokenUsage } = await this.executeChat(messages, schema);

			console.log(
				`[LLM:${this.providerName}] ✅ Response received (${content.length} chars)`
			);

			// Log interaction with token usage info
			await logLLMInteraction(messages, content, this.providerName, this.model, tokenUsage);

			return content;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`[LLM:${this.providerName}] ❌ Error: ${errorMessage}`);
			throw error;
		}
	}
}
