import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MANAGER_ADDRESS = "0x7fa859B1E10782Ae660154F9e6b62Df8E2561476"
const ROYALTY_VAULT_ADDRESS = "0x7fa859B1E10782Ae660154F9e6b62Df8E2561476"


const proxyModule = buildModule("ProxyModuleSonic", (m) => {

  const proxyAdminOwner ="0x53C8c0F72F879efD157189173E0530cE515BC290";

  const implementation = m.contract("PaniniNFTs");

  const initializerData = m.encodeFunctionCall(implementation, "initialize", [
    proxyAdminOwner, //owner
    MANAGER_ADDRESS, // manager        
    ROYALTY_VAULT_ADDRESS, // royalty receiver
    5000
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

