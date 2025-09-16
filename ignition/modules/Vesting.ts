import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const VestingModule = buildModule('VestingModule', (m) => {
  const vesting = m.contract('SimpleVesting');

  return { vesting };
});

export default VestingModule;
