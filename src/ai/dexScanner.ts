import axios from "axios";
import { TokenData } from "../types";

export async function fetchDexscreenerData(input: string): Promise<TokenData> {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/search?q=${input}`
    );
    const pair = response.data.pairs?.[0];
    if (!pair) {
      return {
        name: "Unknown",
        chain: "Unknown",
        price: 0,
        liquidity: 0,
        volume24h: 0,
        fdv: 0,
        transactions24h: 0,
        marketCap: 0,
        address: input,
        symbol: "",
      };
    }
    return {
      name: pair.baseToken.name,
      chain: pair.chainId,
      price: pair.priceUsd || 0,
      liquidity: pair.liquidity?.usd || 0,
      volume24h: pair.volume?.h24 || 0,
      fdv: pair.fdv || 0,
      transactions24h: pair.txns?.h24?.buys + pair.txns?.h24?.sells || 0,
      marketCap: 0,
      address: pair.baseToken.address || input,
      symbol: pair.baseToken.symbol,
    };
  } catch (error) {
    console.error("Dexscreener API error:", error);
    return {
      name: "Unknown",
      chain: "Unknown",
      price: 0,
      liquidity: 0,
      volume24h: 0,
      fdv: 0,
      transactions24h: 0,
      marketCap: 0,
      address: input,
      symbol: "",
    };
  }
}

export async function fetchDexscreenerDataByAddress(
  input: string
): Promise<TokenData | null> {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${input.toLowerCase()}`
    );
    const pair = response.data.pairs?.[0];
    if (!pair) {
      return null;
    }
    return {
      name: pair.baseToken?.name,
      chain: pair.chainId,
      price: pair.priceUsd,
      liquidity: pair.liquidity?.usd,
      address: pair.baseToken?.address,
      fdv: pair.fdv,
      transactions24h: pair.txns?.h24?.buys + pair.txns?.h24?.sells || 0,
      marketCap: 0,
      volume24h: pair.volume?.h24 || 0,
      symbol: pair.baseToken?.symbol,
    };
  } catch (error) {
    console.log("Error fetching token from DexScreener");
    return null;
  }
}
