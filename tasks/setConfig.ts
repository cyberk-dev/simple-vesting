import { task } from 'hardhat/config';
import { getConfig } from './CONFIG.js';
import VestingModule from '../ignition/modules/Vesting.js';
import { parseEther } from 'viem';

export const setConfigTask = task('set-config', 'Set the config of the contract')
  .setAction(async () => {
    return {
      default: async (_, hre) => {
        const { ignition } = await hre.network.connect();
        const { vesting } = await ignition.deploy(VestingModule);

        const config = getConfig(hre.globalOptions.network);
        // '0xD868110D17C01577457bDEDDd1e37198f05FdC5f': ['5000', '5000', '5000', '5000', '5000', '5000'],
        // '0xdf33cE12741dc7Bf9f7573f9F95Cf3D6c45Cc27F': ['16000', '16000', '16000', '16000', '16000', '16000'],
        await vesting.write.setConfig([
          config.releaseTimes,
          ['0xD868110D17C01577457bDEDDd1e37198f05FdC5f', '0xdf33cE12741dc7Bf9f7573f9F95Cf3D6c45Cc27F'],
          [
            [
              parseEther('5000'),
              parseEther('5000'),
              parseEther('5000'),
              parseEther('5000'),
              parseEther('5000'),
              parseEther('5000'),
            ],
            [
              parseEther('16000'),
              parseEther('16000'),
              parseEther('16000'),
              parseEther('16000'),
              parseEther('16000'),
              parseEther('16000'),
            ],
          ],
        ]);

        console.log('Config set', config.userTimeAmounts);
      },
    };
  })
  .build();
