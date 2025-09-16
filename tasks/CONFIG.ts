import { DateTime } from 'luxon';
import { parseEther } from 'viem';

export const configs = {
  bscTestnet: {
    supportedUsdTokens: ['0x1FA6283ec7fBb012407E7A5FC44a78B065b2a1cf'],
    releaseTimes: ['2025-08-25T04:30:00Z', '2025-08-25T04:45:00Z'],
    users: {
      '0x7e1FbF37D52A677788B95f2e718998cA8fbe15fb': ['300', '100'],
      '0x60F1AAf4E9C9b79A225910eB7F525baf88bcf3A4': ['600', '200'],
    },
  },
  bscMainnet: {
    supportedUsdTokens: ['0x55d398326f99059fF775485246999027B3197955', '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'],
    releaseTimes: [
      '2025-09-01T00:00:00Z',
      '2025-10-01T00:00:00Z',
      '2025-11-01T00:00:00Z',
      '2025-12-01T00:00:00Z',
      '2026-01-01T00:00:00Z',
      '2026-02-01T00:00:00Z',
    ],
    users: {
      '0xD868110D17C01577457bDEDDd1e37198f05FdC5f': ['5000', '5000', '5000', '5000', '5000', '5000'],
      '0xdf33cE12741dc7Bf9f7573f9F95Cf3D6c45Cc27F': ['16000', '16000', '16000', '16000', '16000', '16000'],
    },
  },
};

export const getConfig = (network: string) => {
  const config = configs[network as keyof typeof configs];
  return {
    supportedUsdTokens: config.supportedUsdTokens as `0x${string}`[],
    releaseTimes: config.releaseTimes.map((time) => BigInt(DateTime.fromISO(time).toSeconds())),
    users: Object.keys(config.users).map((user) => user as `0x${string}`),
    userTimeAmounts: Object.values(config.users).map((amount) => amount.map((amount) => parseEther(amount))),
  };
};
