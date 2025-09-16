import { task } from 'hardhat/config';
import VestingModule from '../ignition/modules/Vesting.js';

export const startTask = task('start', 'Start the contract')
  .setAction(async () => {
    return {
      default: async (_, hre) => {
        const { ignition } = await hre.network.connect();
        const { vesting } = await ignition.deploy(VestingModule);
        await vesting.write.start();
      },
    };
  })
  .build();
