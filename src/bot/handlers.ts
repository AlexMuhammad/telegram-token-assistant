import { Context } from "grammy";
import { logQuery } from "../db";
import { TokenData } from "../types";
import { formatTokenResponse } from "../utils/format";
import { createTokenData } from "../utils/helper";
import { ERROR_MESSAGES } from "../constants";
import {
  getCachedAnalysis,
  getCachedCoinGeckoData,
  getCachedDexscreenerData,
  getCachedDexscreenerDataByAddress,
  getCachedTopTokens,
} from "../api";

export async function handleStartCommand(ctx: Context) {
  await ctx.reply(
    'Welcome to the Crypto Expert Bot! Ask anything about crypto: token prices (e.g., "What’s the price of $PEPE?"), contract addresses (e.g., "Give me address PEPE"), or broader topics like "What’s the future of DeFi?" or "Should I invest in Bitcoin ETFs?". Use /help for more info.'
  );
}

export async function handleHelpCommand(ctx: Context) {
  await ctx.reply(`
Ask anything about crypto! Examples:
- Token details: Send a contract address (any format, e.g., 7xKX... for Solana or 0x123... for Ethereum).
- Prices: "What’s the price of $PEPE?"
- Contract address: "Give me address PEPE"
- Evaluations: "Is Popcat worth buying?"
- Trends: "What’s trending in crypto?" or "Which are the best tokens to buy today?"
- General: "What’s the future of DeFi?" or "Should I invest in Bitcoin ETFs?"
- /help: Show this message.
  `);
}

async function handlePriceQuery(
  input: string,
  tokenInput: string,
  chatId: number
): Promise<string> {
  try {
    const dexData = await getCachedDexscreenerData(tokenInput);
    if (!dexData) {
      return ERROR_MESSAGES.TOKEN_NOT_FOUND;
    }

    const geckoData = await getCachedCoinGeckoData(dexData.symbol!);
    const tokenData = await createTokenData(dexData, geckoData);

    const reply = formatTokenResponse(tokenData);
    await logQuery(chatId, input, reply, JSON.stringify(tokenData));
    return reply;
  } catch (error) {
    console.error("Error in handlePriceQuery:", error);
    return ERROR_MESSAGES.TOKEN_NOT_FOUND;
  }
}

async function handleCompareTokensQuery(
  input: string,
  tokenInput: string,
  chatId: number
): Promise<string> {
  try {
    const tokens = tokenInput.split(",").map((token: string) => token.trim());
    const tokenDataArray: TokenData[] = [];

    const tokenPromises = tokens.map(async (token) => {
      try {
        const dexData = await getCachedDexscreenerData(token);
        if (dexData) {
          const geckoData = await getCachedCoinGeckoData(dexData.symbol!);
          return await createTokenData(dexData, geckoData);
        }
        return null;
      } catch (error) {
        console.error(`Error fetching data for token ${token}:`, error);
        return null;
      }
    });

    const results = await Promise.all(tokenPromises);
    tokenDataArray.push(...(results.filter(Boolean) as TokenData[]));

    if (tokenDataArray.length === 0) {
      return ERROR_MESSAGES.COMPARE_FAILED;
    }

    const { insight } = await getCachedAnalysis(tokenDataArray, input, chatId);
    let reply = tokenDataArray
      .map((tokenData) => formatTokenResponse(tokenData))
      .join("\n\n");
    reply += `\n\n🧠 AI Insight:\n${insight}`;

    await logQuery(chatId, input, reply, JSON.stringify(tokenDataArray));
    return reply;
  } catch (error) {
    console.error("Error in handleCompareTokensQuery:", error);
    return ERROR_MESSAGES.COMPARE_FAILED;
  }
}

async function handleTopTokensQuery(
  input: string,
  chatId: number
): Promise<string> {
  try {
    const topTokens = await getCachedTopTokens(input);

    if (!Array.isArray(topTokens) || topTokens.length === 0) {
      return ERROR_MESSAGES.TOP_TOKENS_FAILED;
    }

    const { insight } = await getCachedAnalysis(topTokens, input, chatId);
    const tokenList = topTokens
      .map(
        (token) =>
          `📈 ${token.name}: $${token.price.toFixed(
            8
          )}, Market Cap: $${token.marketCap?.toLocaleString()}`
      )
      .join("\n");

    const reply = `Here are some top tokens based on market data:\n${tokenList}\n\n🧠 AI Insight:\n${insight}`;
    await logQuery(chatId, input, reply, JSON.stringify(topTokens));
    return reply;
  } catch (error) {
    console.error("Error in handleTopTokensQuery:", error);
    return ERROR_MESSAGES.TOP_TOKENS_FAILED;
  }
}

async function handleGeneralQuery(
  input: string,
  chatId: number,
  insight: string
): Promise<string> {
  const reply = `🧠 AI Insight:\n${insight}`;
  await logQuery(chatId, input, reply, JSON.stringify(""));
  return reply;
}

async function handleAddressQuery(
  input: string,
  tokenInput: string,
  chatId: number
): Promise<string> {
  try {
    const dexDataByAddress = await getCachedDexscreenerDataByAddress(
      tokenInput.trim() || input
    );
    if (!dexDataByAddress) {
      return ERROR_MESSAGES.TOKEN_NOT_FOUND;
    }

    const geckoData = await getCachedCoinGeckoData(dexDataByAddress.symbol!);
    const tokenData = await createTokenData(dexDataByAddress, geckoData);

    const { insight, safetyScore } = await getCachedAnalysis(
      tokenData,
      input,
      chatId
    );

    let reply = formatTokenResponse(tokenData);
    reply += `\n\n🧠 AI Insight:\n${insight}`;
    reply += `\n🛡 Safety Score: ${safetyScore?.score ?? 0}% - ${
      safetyScore?.explanation ?? "No explanation provided."
    }`;

    await logQuery(chatId, input, reply, JSON.stringify(tokenData));
    return reply;
  } catch (error) {
    console.error("Error in handleAddressQuery:", error);
    return ERROR_MESSAGES.TOKEN_NOT_FOUND;
  }
}

async function handleTokenQuery(
  input: string,
  tokenInput: string,
  chatId: number
): Promise<string> {
  try {
    const dexData = await getCachedDexscreenerData(tokenInput.trim() || input);
    if (!dexData) {
      return ERROR_MESSAGES.TOKEN_NOT_FOUND;
    }

    const geckoData = await getCachedCoinGeckoData(dexData.symbol!);
    const tokenData = await createTokenData(dexData, geckoData);

    const reply = formatTokenResponse(tokenData);
    await logQuery(chatId, input, reply, JSON.stringify(tokenData));
    return reply;
  } catch (error) {
    console.error("Error in handleTokenQuery:", error);
    return ERROR_MESSAGES.TOKEN_NOT_FOUND;
  }
}

export async function handleTextMessage(ctx: Context): Promise<void> {
  const input = ctx.message?.text?.trim();
  const chatId = ctx.message?.chat.id;

  if (!input || !chatId) {
    return;
  }

  try {
    await ctx.replyWithChatAction("typing");

    const initialAnalysis = await getCachedAnalysis({}, input, chatId);
    const { queryType, tokenInput, insight } = initialAnalysis;

    let reply = "";

    console.log("queryType", queryType);

    switch (queryType) {
      case "address":
        reply = await handleAddressQuery(input, tokenInput, chatId);
        break;

      case "token":
        reply = await handleTokenQuery(input, tokenInput, chatId);
        break;

      case "price":
        reply = await handlePriceQuery(input, tokenInput, chatId);
        break;

      case "compare_tokens":
        reply = await handleCompareTokensQuery(input, tokenInput, chatId);
        break;

      case "top_tokens":
        reply = await handleTopTokensQuery(input, chatId);
        break;

      case "general":
        reply = await handleGeneralQuery(input, chatId, insight);
        break;

      default:
        reply = ERROR_MESSAGES.UNKNOWN_REQUEST;
        break;
    }

    await ctx.reply(reply, { parse_mode: "Markdown" });
  } catch (error: any) {
    console.error("Bot error:", error);
    await ctx.reply(`⚠️ Error: ${error.message}`);
  }
}
