import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getRecentLogs } from "../db";
import { CRYPTO_PROMPT } from "../api/prompt";

interface SafetyScore {
  score: number;
  explanation: string;
}

interface AnalysisResult {
  queryType:
    | "address"
    | "token"
    | "price"
    | "top_tokens"
    | "compare_tokens"
    | "general";
  tokenInput: string;
  insight: string;
  safetyScore?: SafetyScore;
}

interface ConversationLog {
  input: string;
  response: string;
}

const memories: Map<number, BufferMemory> = new Map();
const MAX_MEMORIES = 1000;
const CLEANUP_INTERVAL = 1000 * 60 * 60;

const createModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    temperature: 0.7,
    apiKey,
    maxRetries: 3,
  });
};

const cleanupMemories = (): void => {
  if (memories.size > MAX_MEMORIES * 0.8) {
    const keysToRemove = Array.from(memories.keys()).slice(
      0,
      Math.floor(MAX_MEMORIES * 0.2)
    );
    keysToRemove.forEach((key) => memories.delete(key));
  }
};

setInterval(cleanupMemories, CLEANUP_INTERVAL);

const getMemory = (chatId: number): BufferMemory => {
  if (!memories.has(chatId)) {
    if (memories.size >= MAX_MEMORIES) {
      cleanupMemories();
    }

    memories.set(
      chatId,
      new BufferMemory({
        returnMessages: true,
        memoryKey: "history",
        inputKey: "input",
      })
    );
  }

  return memories.get(chatId)!;
};

const saveToMemory = async (
  chatId: number,
  userInput: string,
  aiResponse: AnalysisResult | string
): Promise<void> => {
  try {
    const memory = getMemory(chatId);

    let responseText = "";
    if (typeof aiResponse === "object" && aiResponse.insight) {
      responseText = aiResponse.insight;
    } else if (typeof aiResponse === "string") {
      responseText = aiResponse;
    } else {
      responseText = JSON.stringify(aiResponse);
    }

    await memory.saveContext({ input: userInput }, { output: responseText });
  } catch (error) {}
};

const getConversationContext = async (chatId: number): Promise<string> => {
  try {
    if (!memories.has(chatId)) {
      return "";
    }

    const memory = memories.get(chatId)!;
    const memoryVariables = await memory.loadMemoryVariables({});

    if (Array.isArray(memoryVariables.history)) {
      return memoryVariables.history
        .map((msg: any) => {
          const msgType = msg.type || msg._getType?.();
          if (msgType === "human") {
            return `Human: ${msg.content}`;
          } else if (msgType === "ai") {
            return `AI: ${msg.content}`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");
    }

    return memoryVariables.history || "";
  } catch (error) {
    console.log(
      `Failed to get conversation context for chat ${chatId}:`,
      error
    );
    return "";
  }
};

const createAnalysisPrompt = (): PromptTemplate => {
  return PromptTemplate.fromTemplate(CRYPTO_PROMPT);
};

const parseAIResponse = (content: string): AnalysisResult => {
  try {
    let jsonStr = content.trim();

    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    jsonStr = jsonStr.replace(/```json\s*|\s*```/g, "").trim();

    const result = JSON.parse(jsonStr);

    return {
      queryType: result.queryType,
      tokenInput: result.tokenInput || "",
      insight: result.insight || "No insight available",
      safetyScore: result.safetyScore,
    };
  } catch (error) {
    throw new Error("Could not parse AI response as JSON");
  }
};

const getRecentLogsWithFallback = async (
  chatId: number
): Promise<ConversationLog[]> => {
  try {
    return await getRecentLogs(chatId);
  } catch (error) {
    return [];
  }
};

const formatConversationHistory = (logs: ConversationLog[]): string => {
  return logs
    .map((log) => `User: ${log.input}\nAI: ${log.response}`)
    .join("\n");
};

const createFallbackResult = (): AnalysisResult => ({
  queryType: "general",
  tokenInput: "",
  insight:
    "I'm having trouble processing your request right now. Could you please rephrase your question or try again?",
});

const validateInputs = (userInput: string, chatId: number): void => {
  if (!userInput?.trim()) {
    throw new Error("User input is required");
  }

  if (!Number.isInteger(chatId) || chatId < 0) {
    throw new Error("Valid chat ID is required");
  }
};

export const analyzeQuery = async (
  tokenData: any = {},
  userInput: string,
  chatId: number
): Promise<AnalysisResult> => {
  validateInputs(userInput, chatId);

  const model = createModel();

  try {
    const contextLogs = await getRecentLogsWithFallback(chatId);
    const tokenDataStr = JSON.stringify(tokenData, null, 2);
    const formattedHistory = formatConversationHistory(contextLogs);

    const prompt = createAnalysisPrompt();
    const memory = getMemory(chatId);

    const chain = new ConversationChain({
      llm: model,
      prompt: prompt,
      memory: memory,
      verbose: false,
    });

    const response = await chain.call({
      data: tokenDataStr,
      input: userInput.trim(),
      history: formattedHistory,
    });

    const result = parseAIResponse(response.response || "");
    await saveToMemory(chatId, userInput, result);

    return result;
  } catch (error) {
    const fallbackResult = createFallbackResult();
    await saveToMemory(chatId, userInput, fallbackResult);
    return fallbackResult;
  }
};

const extractSymbolFallback = (userMessage: string): string => {
  const match = userMessage.match(/\b([A-Z]{2,10})\b/);
  return match ? match[1] : "";
};

const createSymbolPrompt = (
  conversationHistory: string,
  userMessage: string
): string => {
  return `
You are a cryptocurrency symbol converter. Given the conversation history and current user message, extract and return ONLY the cryptocurrency symbol in uppercase, without any "$" sign.

If the user refers to a cryptocurrency discussed earlier without explicitly naming it, use that context to determine the correct symbol.

Return ONLY the symbol with no additional text or explanation.

Conversation History:
${conversationHistory}

Current User Message: ${userMessage.trim()}
  `.trim();
};

const cleanSymbolResponse = (symbol: string): string => {
  return symbol.replace(/^\$+/, "").trim().toUpperCase();
};

export const convertToSymbol = async (
  userMessage: string,
  chatId: number = 0
): Promise<string> => {
  if (!userMessage?.trim()) {
    return "";
  }

  const model = createModel();

  try {
    const conversationHistory = await getConversationContext(chatId);
    const prompt = createSymbolPrompt(conversationHistory, userMessage);

    const response = await model.invoke([
      new SystemMessage(
        "You are a cryptocurrency symbol extractor. Return only the symbol, nothing else."
      ),
      new HumanMessage(prompt),
    ]);

    const symbol = response.content?.toString() ?? "";
    const cleanSymbol = cleanSymbolResponse(symbol);

    return cleanSymbol;
  } catch (error) {
    const fallbackSymbol = extractSymbolFallback(userMessage);
    return fallbackSymbol;
  }
};

export const clearChatMemory = (chatId: number): boolean => {
  if (memories.has(chatId)) {
    memories.delete(chatId);
    return true;
  }
  return false;
};

export const getMemoryStats = () => {
  return {
    totalChats: memories.size,
    maxMemories: MAX_MEMORIES,
    memoryUsage: `${((memories.size / MAX_MEMORIES) * 100).toFixed(1)}%`,
  };
};
