export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface JSONSchema {
	type: string;
	properties: Record<string, unknown>;
	required?: string[];
	[key: string]: unknown;
}

export interface LLMAdapter {
	chat(messages: ChatMessage[], schema?: JSONSchema): Promise<string>;
}
