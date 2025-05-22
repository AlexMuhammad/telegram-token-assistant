import { analyzeQuery } from "../ai";
import { fetchCoinGeckoData, fetchTopTokens } from "../ai/coinGecko";
import {
  fetchDexscreenerData,
  fetchDexscreenerDataByAddress,
} from "../ai/dexScanner";
import { generateCacheKey, getCache, setCache } from "../cache";

export async function getCachedDexscreenerData(symbol: string): Promise<any> {
  const cacheKey = generateCacheKey.tokenData(symbol);

  let cachedData = getCache<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const data = await fetchDexscreenerData(symbol);
    if (data) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching dexscreener data for ${symbol}:`, error);
    return null;
  }
}

export async function getCachedDexscreenerDataByAddress(
  address: string
): Promise<any> {
  const cacheKey = generateCacheKey.addressData(address);

  let cachedData = getCache<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const data = await fetchDexscreenerDataByAddress(address);
    if (data) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error(
      `Error fetching dexscreener data by address ${address}:`,
      error
    );
    return null;
  }
}

export async function getCachedCoinGeckoData(symbol: string): Promise<any> {
  const cacheKey = generateCacheKey.geckoData(symbol);

  let cachedData = getCache<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const data = await fetchCoinGeckoData(symbol);
    if (data) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    return null;
  }
}

export async function getCachedAnalysis(
  tokenData: any,
  input: string,
  chatId: number
): Promise<any> {
  const cacheKey = generateCacheKey.analysis(input, chatId);

  let cachedData = getCache<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const data = await analyzeQuery(tokenData, input, chatId);
    if (data) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error(`Error in analysis for input: ${input}`, error);
    return {
      insight: "Analysis unavailable at the moment.",
      safetyScore: null,
    };
  }
}

export async function getCachedTopTokens(input: string): Promise<any> {
  const cacheKey = generateCacheKey.topTokens(input);

  let cachedData = getCache<any>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const data = await fetchTopTokens();
    if (data) {
      setCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching top tokens:`, error);
    return null;
  }
}
