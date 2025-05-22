// Constants
export const WELCOME_MESSAGE =
  'Welcome to the Crypto Expert Bot! Ask anything about crypto: token prices (e.g., "What\'s the price of $PEPE?"), contract addresses (e.g., "Give me address PEPE"), or broader topics like "What\'s the future of DeFi?" or "Should I invest in Bitcoin ETFs?". Use /help for more info.';

export const HELP_MESSAGE = `
Ask anything about crypto! Examples:
- Token details: Send a contract address (any format, e.g., 7xKX... for Solana or 0x123... for Ethereum).
- Prices: "What's the price of $PEPE?"
- Contract address: "Give me address PEPE"
- Evaluations: "Is Popcat worth buying?"
- Trends: "What's trending in crypto?" or "Which are the best tokens to buy today?"
- General: "What's the future of DeFi?" or "Should I invest in Bitcoin ETFs?"
- /help: Show this message.
`;

export const ERROR_MESSAGES = {
  TOKEN_NOT_FOUND: `❌ Sorry, I couldn't find data for that token.\nTry a valid token symbol (e.g., "$PEPE") or contract address.`,
  COMPARE_FAILED: `❌ Sorry, I couldn't find data to compare the tokens.\nTry valid token symbols (e.g., "PEPE,DOGE,SHIB").`,
  TOP_TOKENS_FAILED: `❌ Sorry, I couldn't fetch top tokens right now.\nTry again later or ask about a specific token.`,
  UNKNOWN_REQUEST: `❓ Sorry, I couldn't understand your request.\nTry a token symbol, contract address, or ask about crypto trends.\nUse /help for guidance.`,
};
