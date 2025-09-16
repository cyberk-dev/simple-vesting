import type { HardhatUserConfig } from 'hardhat/config';
import hardhatNetworkHelpers from '@nomicfoundation/hardhat-network-helpers';
import hardhatToolboxViemPlugin from '@nomicfoundation/hardhat-toolbox-viem';
import hardhatViemAssertions from '@nomicfoundation/hardhat-viem-assertions';
import hardhatVerify from '@nomicfoundation/hardhat-verify';
import { configVariable } from 'hardhat/config';
import { deployTask } from './tasks/deploy.js';
import { addUsdTokensTask } from './tasks/addUsdTokens.js';
import { setConfigTask } from './tasks/setConfig.js';
import { startTask } from './tasks/start.js';
import { deployAllTask } from './tasks/_DEPLOY_ALL.js';

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, hardhatNetworkHelpers, hardhatViemAssertions, hardhatVerify],
  tasks: [deployTask, addUsdTokensTask, setConfigTask, startTask, deployAllTask],
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
  verify: {
    etherscan: {
      apiKey: configVariable('ETHERSCAN_API_KEY'),
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
      ignition: {
        explorerUrl: 'https://testnet.bscscan.com',
      },
      accounts: [configVariable('BSC_TESTNET_PRIVATE_KEY')],
    },
    bscMainnet: {
      type: 'http',
      chainType: 'l1',
      url: 'https://bsc-dataseed.bnbchain.org',
      ignition: {
        explorerUrl: 'https://bscscan.com',
      },
      accounts: [configVariable('BSC_PRIVATE_KEY')],
    },
  },
};

export default config;
