import { task } from 'hardhat/config';

export const deployAllTask = task('deploy-all', 'Deploy the contract')
  .setAction(async () => {
    return {
      default: async (_, hre) => {
        const { ignition, networkHelpers } = await hre.network.connect();
        await hre.tasks.getTask('deploy').run();
        await hre.tasks.getTask('add-usd-tokens').run();
        await hre.tasks.getTask('set-config').run();
        // await hre.tasks.getTask('start').run();
      },
    };
  })
  .build();
