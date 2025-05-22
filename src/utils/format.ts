import { TokenData } from "../types";

export function formatTokenResponse(tokenData: any): string {
  return `
📊 Token: ${tokenData.name}
Chain: ${tokenData.chain}
Price: $${tokenData.price}
Liquidity: $${tokenData.liquidity.toLocaleString()}
Volume 24h: ${tokenData.volume24h.toLocaleString()} ${
    tokenData.transactions24h ? `(${tokenData.transactions24h} txns)` : ""
  }
${tokenData.fdv ? `FDV: $${tokenData.fdv.toLocaleString()}` : ""}
${
  tokenData.marketCap
    ? `Market Cap: $${tokenData.marketCap.toLocaleString()}`
    : ""
}
Address: ${tokenData.address}
  `;
}
