import axios from "axios";
import { TokenData } from "../types";

export async function fetchCoinGeckoData(symbol: string): Promise<TokenData> {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/markets`,
      {
        params: { vs_currency: "usd", symbol: symbol.toLowerCase() },
      }
    );
    const coin = response.data[0];
    if (!coin) {
      return {
        name: "Unknown",
        chain: "Unknown",
        price: 0,
        liquidity: 0,
        volume24h: 0,
        fdv: 0,
        transactions24h: 0,
        marketCap: 0,
        address: "",
        symbol: "",
      };
    }
    return {
      name: coin.name,
      chain: coin.platforms?.ethereum ? "Ethereum" : "Unknown",
      price: coin.current_price || 0,
      liquidity: 0,
      volume24h: coin.total_volume || 0,
      fdv: coin.fully_diluted_valuation || 0,
      transactions24h: 0,
      marketCap: coin.market_cap || 0,
      address: coin.contract_address || "",
      symbol: coin.symbol,
    };
  } catch (error) {
    console.error("CoinGecko API error:", error);
    return {
      name: "Unknown",
      chain: "Unknown",
      price: 0,
      liquidity: 0,
      volume24h: 0,
      fdv: 0,
      transactions24h: 0,
      marketCap: 0,
      address: "",
      symbol: "",
    };
  }
}

export async function fetchTopTokens(): Promise<TokenData[]> {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/markets`,
      {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 5,
          page: 1,
        },
      }
    );
    return response.data.map((coin: any) => ({
      name: coin.name,
      chain: coin.platforms?.ethereum ? "Ethereum" : "Unknown",
      price: coin.current_price || 0,
      liquidity: 0,
      volume24h: coin.total_volume || 0,
      fdv: coin.fully_diluted_valuation || 0,
      transactions24h: 0,
      marketCap: coin.market_cap || 0,
      address: coin.contract_address || "",
    }));
  } catch (error) {
    console.error("CoinGecko top tokens API error:", error);
    return [];
  }
}
