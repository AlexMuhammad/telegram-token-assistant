import { TokenData } from "../types";

export async function createTokenData(
  dexData: any,
  geckoData?: any
): Promise<TokenData> {
  return {
    liquidity: dexData?.liquidity,
    chain: dexData?.chain,
    name: dexData?.name,
    price: dexData?.price,
    marketCap: geckoData?.marketCap,
    address: dexData?.address,
    symbol: dexData?.symbol,
    volume24h: dexData?.volume24h,
    fdv: dexData?.fdv,
    transactions24h: dexData?.transactions24h,
  };
}
