import fs from "fs";
import path from "path";
import { ChatMessage } from "./types";

const LOGS_DIR = path.join(process.cwd(), "llm_logs");

export interface TokenUsage {
  totalTokens: number;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Логирует LLM запрос и ответ в файл
 * Формат файла: [SYSTEM PROMPT] ... [USER PROMPT] ... [LLM RESPONSE] ... [TOKENS] ...
 */
export async function logLLMInteraction(
  messages: ChatMessage[],
  response: string,
  provider: string,
  model: string,
  tokenUsage?: TokenUsage
): Promise<void> {
  try {
    // Создать директорию если её нет
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    // Генерировать имя файла с timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${provider}-${model}-${timestamp}.log`;
    const filepath = path.join(LOGS_DIR, filename);

    // Форматировать промпты и ответ
    let logContent = "";

    for (const msg of messages) {
      const separator = `\n${"=".repeat(60)}\n[${msg.role.toUpperCase()}]\n${"=".repeat(60)}\n`;
      logContent += separator + msg.content + "\n";
    }

    logContent += `\n${"=".repeat(60)}\n[LLM_RESPONSE]\n${"=".repeat(60)}\n`;
    logContent += response + "\n";

    // Добавить информацию о токенах если доступна
    if (tokenUsage) {
      logContent += `\n${"=".repeat(60)}\n[TOKEN_USAGE]\n${"=".repeat(60)}\n`;
      logContent += `Total Tokens: ${tokenUsage.totalTokens}\n`;
      if (tokenUsage.inputTokens !== undefined) {
        logContent += `Input Tokens: ${tokenUsage.inputTokens}\n`;
      }
      if (tokenUsage.outputTokens !== undefined) {
        logContent += `Output Tokens: ${tokenUsage.outputTokens}\n`;
      }
    }

    logContent += `\n${"=".repeat(60)}\n[END]\n${"=".repeat(60)}\n`;

    // Записать в файл
    fs.writeFileSync(filepath, logContent, "utf-8");

    console.log(`[LLMLogger] Logged to ${filepath}`);
  } catch (error) {
    console.error("[LLMLogger] Error logging LLM interaction:", error);
  }
}
