export interface TokenData {
  name: string;
  chain: string;
  price: number;
  liquidity: number;
  volume24h: number;
  fdv: number;
  transactions24h: number;
  marketCap: number;
  address?: string;
  symbol?: string;
}
