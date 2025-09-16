import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import SimpleVesting from './Vesting.js';

const VestingConfigModule = buildModule('VestingConfigModule', (m) => {
  const { vesting } = m.useModule(SimpleVesting);

  const supportedUsdTokens = m.getParameter('supportedUsdTokens');
  const releaseTimes = m.getParameter('releaseTimes');
  const users = m.getParameter('users');
  const userTimeAmounts = m.getParameter('userTimeAmounts');

  m.call(vesting, 'setSupportedUsdTokens', [supportedUsdTokens]);
  m.call(vesting, 'setConfig', [releaseTimes, users, userTimeAmounts]);

  return { vesting };
});

export default VestingConfigModule;
