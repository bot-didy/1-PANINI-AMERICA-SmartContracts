// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
// const RoyaltyShare = 1000 // this is 10% conversion, as per ERC-2981

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const bridgeModule = buildModule("pBridge", (erc721) => {
 
  const bridgeSigner = '0x7fa859B1E10782Ae660154F9e6b62Df8E2561476'
  const bridgeOwner = '0x7fa859B1E10782Ae660154F9e6b62Df8E2561476'

  const contractAddress = erc721.contract("NFTBridge", [bridgeSigner,bridgeOwner], {});
  return { contractAddress };

});

export default bridgeModule;



// npx hardhat ignition deploy ./ignition/modules/deploy.ts --network <your-network>
// npx hardhat ignition deploy ./ignition/modules/deploy.ts --network polygonAmoy
// npx hardhat ignition deploy ignition/modules/deployBridge.ts --network polygonAmoy --verify
