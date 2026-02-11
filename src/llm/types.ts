export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMAdapter {
  chat(messages: ChatMessage[]): Promise<string>;
}
