import { task } from 'hardhat/config';
import { getConfig } from './CONFIG.js';
import VestingModule from '../ignition/modules/Vesting.js';

export const addUsdTokensTask = task('add-usd-tokens', 'Add USD tokens to the contract')
  .setAction(async () => {
    return {
      default: async (_, hre) => {
        const { ignition } = await hre.network.connect();
        const { vesting } = await ignition.deploy(VestingModule);

        const config = getConfig(hre.globalOptions.network);
        await vesting.write.setSupportedUsdTokens([config.supportedUsdTokens]);
      },
    };
  })
  .build();
