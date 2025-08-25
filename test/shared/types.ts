import { network } from 'hardhat';

export type NetworkConnection = Awaited<ReturnType<typeof network.connect>>;
