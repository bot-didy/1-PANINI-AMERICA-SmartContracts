// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
// const RoyaltyShare = 1000 // this is 10% conversion, as per ERC-2981

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const nftModule = buildModule("nftModule", (erc721) => {
 
  const collectionName = 'Phoenix NFTs'
  const collectionSymbol = 'PNFTs'
  const defaultAdmin = '0x7fa859B1E10782Ae660154F9e6b62Df8E2561476'
  const contractAddress = erc721.contract("PhoenixSports", [defaultAdmin,collectionName,collectionSymbol], {});
  return { contractAddress };

});

export default nftModule;

// npx hardhat ignition deploy ./ignition/modules/Lock.js --network <your-network>


