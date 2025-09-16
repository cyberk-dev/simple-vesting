import { task } from 'hardhat/config';
import { getConfig } from './CONFIG.js';
import VestingModule from '../ignition/modules/Vesting.js';

export const deployTask = task('deploy', 'Deploy the contract')
  .setAction(async () => {
    return {
      default: async (_, hre) => {
        const { ignition } = await hre.network.connect();
        const { vesting } = await ignition.deploy(VestingModule, {});
      },
    };
  })
  .build();
