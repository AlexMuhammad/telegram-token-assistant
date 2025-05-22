import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600 }); // 10-minute cache

export function getCache<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCache<T>(key: string, value: T) {
  cache.set(key, value);
}

// Cache key generators
export const generateCacheKey = {
  tokenData: (symbol: string) => `token:${symbol.toLowerCase()}`,
  addressData: (address: string) => `address:${address.toLowerCase()}`,
  geckoData: (symbol: string) => `gecko:${symbol.toLowerCase()}`,
  analysis: (input: string, chatId: number) =>
    `analysis:${chatId}:${Buffer.from(input).toString("base64").slice(0, 32)}`,
  topTokens: (input: string) =>
    `top:${Buffer.from(input).toString("base64").slice(0, 24)}`,
};

export function getCacheKey(type: string, identifier: string): string {
  switch (type) {
    case "token":
      return generateCacheKey.tokenData(identifier);
    case "address":
      return generateCacheKey.addressData(identifier);
    case "gecko":
      return generateCacheKey.geckoData(identifier);
    default:
      return `${type}:${identifier}`;
  }
}

export function isCached(key: string): boolean {
  return getCache(key) !== undefined;
}
