// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
// const RoyaltyShare = 1000 // this is 10% conversion, as per ERC-2981

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const nftModule = buildModule("aiERC721C", (erc721) => {
 
  const collectionName = 'AI Creatures'
  const collectionSymbol = 'AICr'
  const defaultAdmin = '0x7fa859B1E10782Ae660154F9e6b62Df8E2561476'
  const contractUri  = 'https://pink-junior-peacock-757.mypinata.cloud/ipfs/bafkreidg2zxe65hf234xwxbvn3fwibgg4i4yhytzmtmy5ondvld3pdhf5q'
  const contractAddress = erc721.contract("PhoenixSports", [defaultAdmin,1000,collectionName,collectionSymbol,contractUri], {});
  return { contractAddress };

});

export default nftModule;

// npx hardhat ignition deploy ./ignition/modules/deploy.ts --network <your-network>
// npx hardhat ignition deploy ./ignition/modules/deploy.ts --network polygonAmoy --verify
// npx hardhat ignition deploy ignition/modules/deploy.ts --network sepolia --verify