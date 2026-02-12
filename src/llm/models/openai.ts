import OpenAI from "openai";
import { ChatCompletion, ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import { ChatMessage, JSONSchema } from "../types";
import { TokenUsage } from "../logger";
import { BaseLLMAdapter } from "./baseLLM";

export class OpenAIAdapter extends BaseLLMAdapter {
  private client: OpenAI;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    super(model, "openai");
    this.client = new OpenAI({ apiKey });
  }

  async executeChat(
    messages: ChatMessage[],
    schema?: JSONSchema
  ): Promise<{ content: string; tokenUsage?: TokenUsage }> {
    const config: ChatCompletionCreateParamsBase = {
      model: this.model,
      messages,
      stream: false,
    };

    // Add JSON Schema if provided
    if (schema) {
      config.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: schema,
          strict: true,
        },
      };
    }

    const response = await this.client.chat.completions.create(config) as ChatCompletion;

    const content = response.choices[0].message.content ?? "";

    // Extract token usage
    const tokenUsage = response.usage
      ? {
          totalTokens: response.usage.total_tokens,
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        }
      : undefined;

    return { content, tokenUsage };
  }
}
