import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MANAGER_ADDRESS = "0x583744DC7550315989244B624A0203961D7d3476"
const ROYALTY_VAULT_ADDRESS = "0x7A64d939709F76340d6EDd09a785deef6237C5b0"


const proxyModule = buildModule("ProxyModuleNFTsT2", (m) => {

  const proxyAdminOwner = "0x3fa463C34DfA9D94c4cA48a90987d162d3F72c92";

  const implementation = m.contract("PhoenixNFTs");

  const initializerData = m.encodeFunctionCall(implementation, "initialize", [
    proxyAdminOwner, //owner
    MANAGER_ADDRESS, // manager
    ROYALTY_VAULT_ADDRESS, // royalty receiver
    500 // 5%
  ]);

  const proxy = m.contract("TransparentUpgradeableProxy", [
    implementation,
    proxyAdminOwner,
    initializerData,
  ]);

  const proxyAdminAddress = m.readEventArgument(
    proxy,
    "AdminChanged",
    "newAdmin"
  );

  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);


  // console.log('implementation', implementation)
  // console.log('proxy', proxy)
  // console.log('proxyAdmin', proxyAdmin)

  return { proxyAdmin, proxy };
});

export default proxyModule;


// npx hardhat ignition deploy ignition/modules/deployProxy.ts --network polygonAmoy --strategy create2 --verify

// npx hardhat ignition deploy ignition/modules/deployProxy.ts --network sepolia --strategy create2 --verify

// npx hardhat ignition deploy ignition/modules/deployProxy.ts --network bsc_testnet --strategy create2 --verify

// npx hardhat ignition deploy ignition/modules/deployProxy.ts --network arb_sepolia --strategy create2

// npx hardhat ignition deploy ignition/modules/deployProxy.ts --network base_sepolia --strategy create2

// npx hardhat ignition deploy ignition/modules/deployProxy.ts --network mainnet --strategy create2 --verify
