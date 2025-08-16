import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const proxyModule = buildModule("RoyaltyVaultProxy", (m) => {

  // const proxyAdminOwner = m.getAccount(0);
  const proxyAdminOwner = '0x7fa859B1E10782Ae660154F9e6b62Df8E2561476';

  const implementation = m.contract("PaniniRoyaltyVault");

  const pauser = "0x7fa859B1E10782Ae660154F9e6b62Df8E2561476"
  const whitelistedReceiver = "0x7fa859B1E10782Ae660154F9e6b62Df8E2561476"

  const uniswapRouter = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
  const initializerData = m.encodeFunctionCall(implementation, "initialize", [
    proxyAdminOwner,
    pauser,
    whitelistedReceiver,
    uniswapRouter,

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


  //   console.log('implementation',implementation)
  //   console.log('proxy',proxy)
  //   console.log('proxyAdmin',proxyAdmin)

  return { proxyAdmin, proxy };
});


export default proxyModule;



// npx hardhat ignition deploy ignition/modules/royaltyVaultProxy.ts --network polygonAmoy --strategy create2 --verify
// npx hardhat ignition deploy ignition/modules/royaltyVaultProxy.ts --network sepolia --strategy create2 --verify
// 0x2076baC51d02012cCcf8612a0c0B4B7bcDD0D154
