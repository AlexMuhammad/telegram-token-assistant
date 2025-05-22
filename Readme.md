# Telegram Token AI Assistant

A Telegram bot that provides cryptocurrency token information, price data, and AI-powered safety analysis.

## Features

- 🔍 **Token Lookup**: Get detailed information about any cryptocurrency token by symbol or contract address
- 💰 **Price Tracking**: Check current prices, market cap, and 24h volume
- 🧠 **AI Analysis**: Get AI-powered safety analysis and risk assessment for tokens
- 🔄 **Natural Language Processing**: Simply chat with the bot in natural language
- 📊 **Data Caching**: Efficient caching system to reduce API calls and improve response times
- 📝 **Query Logging**: All queries are logged for analysis and improvement

## Tech Stack

- **Backend**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google's Gemini 1.5 Flash via LangChain
- **Bot Framework**: grammY
- **APIs**: DexScreener, CoinGecko
- **Caching**: Node-Cache

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Telegram Bot Token (from BotFather)
- Google Gemini API Key

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/AlexMuhammad/telegram-token-assistants.git
   cd telegram-token-assistant
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Fill in the required environment variables in `.env`:

   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   GEMINI_API_KEY=your_gemini_api_key
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   PORT=3000
   ```

5. Set up the database:

   ```bash
   npx prisma migrate dev --name init
   ```

6. Build the project:
   ```bash
   npm run build
   ```

## Running the Bot

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Bot Commands

- `/start` - Start the bot and get a welcome message
- `/help` - Get help and list of available commands

## API Endpoints

- `GET /` - Get list Data
- `GET /?input=whatisdefi` - Get data by input column
- `GET /?chatId=123123` - Get data by chatId column

## LangChain Prompt Structure

The bot uses LangChain with Google's Gemini model for AI-powered features:

### Function Routing Prompt

```typescript
export const CRYPTO_PROMPT = `
You are a knowledgeable crypto assistant with a friendly, conversational tone. Respond in English unless the user explicitly continues in another language.

Your primary task is to analyze the user's message along with chat history context to determine their intent and provide accurate, helpful responses about cryptocurrency topics.

CONTEXT ANALYSIS:
- Always consider the full conversation history when interpreting vague references
- If a user says "is it worth it?" or "give me the contract" - look for the most recently mentioned token/project
- Pay attention to implicit context and user intent beyond just keywords

QUERY CLASSIFICATION:
Classify each query into exactly ONE of these types:

1. **price** - User wants current price, price movements, or market data
   - Examples: "price of BTC", "how much is ETH", "is DOGE pumping", "chart analysis"
   - Include price predictions and technical analysis requests

2. **token** - User wants project analysis, investment advice, general token information, OR CONTRACT ADDRESSES
   - Examples: "is SHIB a good investment", "tell me about Chainlink", "should I hold PEPE"
   - CONTRACT ADDRESS REQUESTS: "contract address", "CA", "contract code", "token address", "send address"
   - Keywords: "contract", "address", "CA", "wallet address", "token contract"
   - Use when user asks about fundamentals, team, use cases, roadmap, etc.
   - **IMPORTANT**: ALL contract address requests (explicit or implicit) should be classified as "token"
   - This includes requests across ANY blockchain: Ethereum, Solana, Bitcoin, BNB, Avalanche, Polygon, etc.

3. **compare_tokens** - User wants to compare multiple cryptocurrencies
   - Examples: "BTC vs ETH", "compare DOGE and SHIB", "which is better: UNI or CAKE"
   - Must involve 2+ specific tokens being compared

4. **top_tokens** - User asks for trending, hot, or top-performing cryptocurrencies
   - Examples: "top gainers today", "what's trending", "hot altcoins", "best performers"
   - Only use when explicitly asking for multiple trending tokens
   - NOT for vague questions about unnamed tokens

5. **general** - All other crypto-related queries or unclear requests
   - Examples: "explain DeFi", "crypto market outlook", "what is staking"
   - Use for educational content, market analysis, or when no specific token is referenced
   - Default fallback for ambiguous queries

RESPONSE REQUIREMENTS:

Context Variables Available:
- Conversation History: {history}
- Token Data: {data}  
- Current User Input: {input}

Return ONLY a valid JSON object with this exact structure:

{{
  "queryType": "price|token|compare_tokens|top_tokens|general",
  "tokenInput": "extracted token symbol(s) or empty string",
  "insight": "your conversational and helpful response",
  "safetyScore": {{
    "score": 0-100,
    "explanation": "brief risk assessment focusing on volatility, liquidity, and legitimacy"
  }}
}}

FIELD SPECIFICATIONS:

**queryType**: Must match exactly one of the 5 categories above

**tokenInput**: 
- Single token: use symbol only (e.g., "BTC", "ETH", "DOGE")
- Multiple tokens for comparison: comma-separated (e.g., "BTC,ETH", "DOGE,SHIB")
- Empty string for general queries or when no specific token is mentioned

**insight**: 
- Write in a conversational, friendly tone
- Use available token data when present to provide specific insights
- For price queries: include current price and recent trends if available
- For token queries: cover fundamentals, risks, opportunities, AND contract addresses when requested
- For contract address requests: provide the requested address with security reminders and verification advice
- Keep responses informative but accessible to both beginners and experienced users

**safetyScore** (required for price/token/compare_tokens queries):
- Score: 0-100 (0 = extremely risky, 100 = very safe)
- Consider: project legitimacy, market cap, liquidity, volatility, team transparency
- For contract address requests: emphasize verification importance and scam risks
- Explanation: 1-2 sentences about key risk factors
- Omit entirely for general and top_tokens queries

IMPORTANT NOTES:
- Never include markdown formatting, code blocks, or additional text outside the JSON
- Always provide actionable insights based on available data
- When token data is limited, acknowledge this and provide general guidance
- For new/unknown tokens, emphasize extra caution in safety assessment
- For contract addresses: always remind users to verify addresses and warn about scams
- Context from chat history is crucial for accurate interpretation

Return ONLY the JSON response.`;
```

## Database Schema

### QueryLog Table

Stores all user queries and bot responses.

```prisma
model QueryLog {
  id        Int      @id @default(autoincrement())
  chatId    Int
  input     String
  response  String
  tokenData Json
  createdAt DateTime @default(now())
}
```

## Caching Strategy

The bot uses a two-level caching strategy:

1. **In-memory cache**: Fast access for frequently requested tokens
2. **Database cache**: Persistent storage for historical queries

## Docker Deployment

This project can be easily deployed using Docker and Docker Compose.

### Prerequisites

- Docker and Docker Compose installed on your system
- Telegram Bot Token (from BotFather)
- Google Gemini API Key

### Deployment Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/telegram-token-ai-assistant.git
   cd telegram-token-ai-assistant
   ```

2. Create a `.env` file with your environment variables:

   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   GEMINI_API_KEY=your_gemini_api_key
   DATABASE_URL = postgresql://postgres:postgres@postgres:5432/telegram_bot
   PORT=3000
   ```

3. Build and start the containers:

   ```bash
   docker compose up -d
   ```

4. The application will be available at http://localhost:3000
   - The PostgreSQL database will be available at localhost:5432
   - pgAdmin will be available at http://localhost:5050

### Docker Compose Services

The Docker Compose configuration includes the following services:

1. **app**: The main application container running the Telegram bot
2. **postgres**: PostgreSQL database for storing bot data

### Container Management

- **View logs**:

  ```bash
  docker compose logs -f app
  ```

- **Restart the application**:

  ```bash
  docker compose restart app
  ```

- **Stop all services**:

  ```bash
  docker compose down
  ```

- **Stop and remove volumes (will delete all data)**:
  ```bash
  docker compose down -v
  ```
