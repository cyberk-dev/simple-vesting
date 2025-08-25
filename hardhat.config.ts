import type { HardhatUserConfig } from 'hardhat/config';
import hardhatNetworkHelpers from '@nomicfoundation/hardhat-network-helpers';
import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import hardhatViemAssertions from '@nomicfoundation/hardhat-viem-assertions';
import { configVariable } from 'hardhat/config';

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, hardhatNetworkHelpers, hardhatViemAssertions],
  solidity: {
    npmFilesToBuild: [
      '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol',
      '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol',
    ],
    profiles: {
      default: {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      production: {
        version: '0.8.28',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    default: {
      type: 'edr-simulated',
      chainType: 'l1',
      allowUnlimitedContractSize: true,
    },
    hardhatMainnet: {
      type: 'edr-simulated',
      chainType: 'l1',
      allowUnlimitedContractSize: true,
    },
    hardhatOp: {
      type: 'edr-simulated',
      chainType: 'op',
      allowUnlimitedContractSize: true,
    },
    sepolia: {
      type: 'http',
      chainType: 'l1',
      url: configVariable('SEPOLIA_RPC_URL'),
      accounts: [configVariable('SEPOLIA_PRIVATE_KEY')],
    },
    bscTestnet: {
      type: 'http',
      chainType: 'l1',
      url: 'https://bsc-testnet-dataseed.bnbchain.org',
      accounts: [configVariable('BSC_TESTNET_PRIVATE_KEY')],
    },
  },
};

export default config;
