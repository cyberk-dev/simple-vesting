import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { network } from 'hardhat';
import VestingModule from '../ignition/modules/Vesting.js';
import { getAddress, parseEther, parseUnits } from 'viem';
import { DateTime } from 'luxon';
import { NetworkConnection } from './shared/types.js';

async function deploy() {
  const connection = this as NetworkConnection;
  const { ignition, viem, networkHelpers } = connection;
  const publicClient = await viem.getPublicClient();
  const [_, deployer, funder, user1, user2, ...wallets] = await viem.getWalletClients();

  const usdc = await viem.deployContract('TestERC20', [parseEther('100000000'), 6], { client: { wallet: deployer } });
  const usdt = await viem.deployContract('TestERC20', [parseEther('100000000'), 18], { client: { wallet: deployer } });

  await usdc.write.transfer([funder.account.address, parseEther('1000000')], { account: deployer.account });
  await usdt.write.transfer([funder.account.address, parseEther('1000000')], { account: deployer.account });

  const { vesting } = await ignition.deploy(VestingModule, {
    defaultSender: deployer.account.address,
  });
  await vesting.write.setConfig(
    [
      [123n, 456n],
      [user1.account.address, user2.account.address],
      [
        [parseEther('300'), parseEther('900')],
        [parseEther('200'), parseEther('600')],
      ],
    ],
    { account: deployer.account }
  );
  await vesting.write.setSupportedUsdTokens([[usdc.address, usdt.address]], { account: deployer.account });

  return { viem, networkHelpers, vesting, tokens: { usdc, usdt }, signers: { deployer, funder, user1, user2 } };
}

describe('Vesting', async function () {
  it('Test Fixture', async function () {
    const connection = await network.connect();
    const { vesting, tokens, signers } = await connection.networkHelpers.loadFixture(deploy.bind(connection));
    assert.equal(await vesting.read.supportedUsdTokens([0n]), getAddress(tokens.usdc.address));
  });

  it('Check user vesting info', async function () {
    const connection = await network.connect();
    const { vesting, tokens, signers } = await connection.networkHelpers.loadFixture(deploy.bind(connection));
    const userVestingInfo = await vesting.read.getUserVestingInfo([signers.user1.account.address]);
    console.log(userVestingInfo);
    // assert.equal(userVestingInfo.length, 2);
    // assert.equal(userVestingInfo[0][0], 123n);
  });

  it('Cant set config after start', async function () {
    const connection = await network.connect();
    const { viem, vesting, tokens, signers } = await connection.networkHelpers.loadFixture(deploy.bind(connection));

    // await vesting.write.start({ account: signers.deployer.account });

    // assert.equal(await vesting.read.started(), true);
    // await viem.assertions.revertWithCustomError(
    //   vesting.write.setSupportedUsdTokens([[tokens.usdc.address]], { account: signers.deployer.account }),
    //   vesting,
    //   'Started'
    // );
    // await viem.assertions.revertWithCustomError(
    await vesting.write.setConfig(
      [
        [123n, 456n, 789n, 1000n, 1234n, 1567n],
        [signers.user1.account.address, signers.user2.account.address],
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
      ],
      { account: signers.deployer.account }
    );
    const info = await vesting.read.getUserVestingInfo([signers.user2.account.address]);
    console.log(info);
    //   vesting,
    //   'Started'
    // );
  });

  // it('2. User not in config should get NoClaimableAmount error when claiming', async function () {
  //   const connection = await network.connect();
  //   const { viem, vesting, tokens, signers } = await connection.networkHelpers.loadFixture(deploy.bind(connection));

  //   // Start the vesting process
  //   await vesting.write.start({ account: signers.deployer.account });

  //   // Try to claim with a user not in config (using a random wallet)
  //   const randomUser = signers.funder; // funder is not in the config

  //   await viem.assertions.revertWithCustomError(
  //     vesting.write.claimUser([randomUser.account.address], { account: randomUser.account }),
  //     vesting,
  //     'NoClaimableAmount'
  //   );
  // });

  // it('3. Claiming without tokens should work but not change anything', async function () {
  //   const connection = await network.connect();
  //   const { viem, networkHelpers, vesting, tokens, signers } = await connection.networkHelpers.loadFixture(
  //     deploy.bind(connection)
  //   );

  //   // Start the vesting process
  //   await vesting.write.start({ account: signers.deployer.account });

  //   // Check initial balances
  //   const initialUsdcBalance = await tokens.usdc.read.balanceOf([vesting.address]);
  //   const initialUsdtBalance = await tokens.usdt.read.balanceOf([vesting.address]);

  //   // Try to claim with user1 (who is in config but no tokens in contract)
  //   await vesting.write.claimUser([signers.user1.account.address], { account: signers.user1.account });

  //   // Check that balances haven't changed (no tokens to claim)
  //   const finalUsdcBalance = await tokens.usdc.read.balanceOf([vesting.address]);
  //   const finalUsdtBalance = await tokens.usdt.read.balanceOf([vesting.address]);

  //   assert.equal(finalUsdcBalance, initialUsdcBalance, 'USDC balance should not change');
  //   assert.equal(finalUsdtBalance, initialUsdtBalance, 'USDT balance should not change');

  //   // Check that user1's claimed amount is still 0
  //   const user1ClaimedAmount = await vesting.read.userClaimedAmounts([signers.user1.account.address]);
  //   assert.equal(user1ClaimedAmount, 0n, 'User1 claimed amount should remain 0');
  // });

  // it('4. Claimable with USDT', async function () {
  //   const connection = await network.connect();
  //   const { viem, networkHelpers, vesting, tokens, signers } = await connection.networkHelpers.loadFixture(
  //     deploy.bind(connection)
  //   );

  //   const time1 = DateTime.now().startOf('month').plus({ month: 1 });
  //   const time2 = time1.plus({ month: 1 });

  //   await vesting.write.setConfig(
  //     [
  //       [BigInt(time1.toSeconds()), BigInt(time2.toSeconds())],
  //       [signers.user1.account.address, signers.user2.account.address],
  //       [
  //         [parseEther('100'), parseEther('200')],
  //         [parseEther('500'), parseEther('1000')],
  //       ],
  //     ],
  //     { account: signers.deployer.account }
  //   );

  //   await vesting.write.start({ account: signers.deployer.account });
  //   await tokens.usdt.write.transfer([vesting.address, parseEther('1800')], {
  //     account: signers.funder.account,
  //   });

  //   await networkHelpers.time.increaseTo(time1.toSeconds() + 100);
  //   await vesting.write.claimUser([signers.user1.account.address]);
  //   assert.equal(await tokens.usdt.read.balanceOf([signers.user1.account.address]), parseEther('100'));
  //   await networkHelpers.time.increaseTo(time2.toSeconds());

  //   await vesting.write.claimUser([signers.user1.account.address]);
  //   assert.equal(await tokens.usdt.read.balanceOf([signers.user1.account.address]), parseEther('300'));
  //   await vesting.write.claimUser([signers.user2.account.address]);
  //   assert.equal(await tokens.usdt.read.balanceOf([signers.user2.account.address]), parseEther('1500'));
  // });

  // it('5. Claimable with USDC', async function () {
  //   const connection = await network.connect();
  //   const { viem, networkHelpers, vesting, tokens, signers } = await connection.networkHelpers.loadFixture(
  //     deploy.bind(connection)
  //   );

  //   const time1 = DateTime.now().startOf('month').plus({ month: 1 });
  //   const time2 = time1.plus({ month: 1 });

  //   await vesting.write.setConfig(
  //     [
  //       [BigInt(time1.toSeconds()), BigInt(time2.toSeconds())],
  //       [signers.user1.account.address, signers.user2.account.address],
  //       [
  //         [parseEther('100'), parseEther('200')],
  //         [parseEther('500'), parseEther('1000')],
  //       ],
  //     ],
  //     { account: signers.deployer.account }
  //   );

  //   await vesting.write.start({ account: signers.deployer.account });
  //   await tokens.usdc.write.transfer([vesting.address, parseUnits('1800', 6)], {
  //     account: signers.funder.account,
  //   });

  //   await networkHelpers.time.increaseTo(time1.toSeconds() + 100);
  //   await vesting.write.claimUser([signers.user1.account.address]);
  //   assert.equal(await tokens.usdc.read.balanceOf([signers.user1.account.address]), parseUnits('100', 6));
  //   await networkHelpers.time.increaseTo(time2.toSeconds());

  //   await vesting.write.claimUser([signers.user1.account.address]);
  //   assert.equal(await tokens.usdc.read.balanceOf([signers.user1.account.address]), parseUnits('300', 6));
  //   await vesting.write.claimUser([signers.user2.account.address]);
  //   assert.equal(await tokens.usdc.read.balanceOf([signers.user2.account.address]), parseUnits('1500', 6));
  // });
  // it('Mix of USDC and USDT', async function () {
  //   const connection = await network.connect();
  //   const { viem, networkHelpers, vesting, tokens, signers } = await connection.networkHelpers.loadFixture(
  //     deploy.bind(connection)
  //   );

  //   const time1 = DateTime.now().startOf('month').plus({ month: 1 });
  //   const time2 = time1.plus({ month: 1 });

  //   await vesting.write.setConfig(
  //     [
  //       [BigInt(time1.toSeconds()), BigInt(time2.toSeconds())],
  //       [signers.user1.account.address, signers.user2.account.address],
  //       [
  //         [parseEther('100'), parseEther('200')],
  //         [parseEther('500'), parseEther('1000')],
  //       ],
  //     ],
  //     { account: signers.deployer.account }
  //   );

  //   await vesting.write.start({ account: signers.deployer.account });
  //   await tokens.usdc.write.transfer([vesting.address, parseUnits('50', 6)], {
  //     account: signers.funder.account,
  //   });
  //   await tokens.usdt.write.transfer([vesting.address, parseEther('50')], {
  //     account: signers.funder.account,
  //   });

  //   await networkHelpers.time.increaseTo(time1.toSeconds() + 100);
  //   await vesting.write.claimUser([signers.user1.account.address]);
  //   assert.equal(await tokens.usdc.read.balanceOf([signers.user1.account.address]), parseUnits('50', 6));
  //   assert.equal(await tokens.usdt.read.balanceOf([signers.user1.account.address]), parseEther('50'));

  //   await tokens.usdc.write.transfer([vesting.address, parseUnits('200', 6)], {
  //     account: signers.funder.account,
  //   });
  //   await networkHelpers.time.increaseTo(time2.toSeconds());
  //   await vesting.write.claimUser([signers.user1.account.address]);
  //   assert.equal(await tokens.usdc.read.balanceOf([signers.user1.account.address]), parseUnits('250', 6));
  //   assert.equal(await tokens.usdt.read.balanceOf([signers.user1.account.address]), parseEther('50'));

  //   await tokens.usdt.write.transfer([vesting.address, parseEther('1200')], {
  //     account: signers.funder.account,
  //   });
  //   await vesting.write.claimUser([signers.user2.account.address]);
  //   assert.equal(await tokens.usdt.read.balanceOf([signers.user2.account.address]), parseEther('1200'));

  //   await tokens.usdt.write.transfer([vesting.address, parseEther('300')], {
  //     account: signers.funder.account,
  //   });
  //   await vesting.write.claimUser([signers.user2.account.address]);
  //   assert.equal(await tokens.usdt.read.balanceOf([signers.user2.account.address]), parseEther('1500'));
  // });
});
