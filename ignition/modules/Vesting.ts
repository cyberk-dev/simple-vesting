import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VestingModule = buildModule('VestingModule', (m) => {
  const vesting = m.contract('SimpleVesting');

  const supportedUsdTokens = m.getParameter('supportedUsdTokens');
  const releaseTimes = m.getParameter('releaseTimes');
  const users = m.getParameter('users');
  const userTimeAmounts = m.getParameter('userTimeAmounts');

  m.call(vesting, 'setSupportedUsdTokens', [supportedUsdTokens]);

  m.call(vesting, 'setConfig', [releaseTimes, users, userTimeAmounts]);

  return { vesting };
});

export default VestingModule;
