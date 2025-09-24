import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const proxyModule = buildModule("RoyaltyVaultProxyT2", (m) => {

  // const proxyAdminOwner = m.getAccount(0);
  // const proxyAdminOwner = '0x48aE434370F65B826428dCb87c4DBEa09d43419F'; // safe wallet address sepo
  // const proxyAdminOwner = '0x66E15875d1bC349D26cc1aB45a547d03383202d7'; // safe wallet address mainnet
  const proxyAdminOwner = '0x3fa463C34DfA9D94c4cA48a90987d162d3F72c92'; // safe wallet address mainnet - t2



  
  const implementation = m.contract("RoyaltyVault");

  const pauser = "0x583744DC7550315989244B624A0203961D7d3476"
  const whitelistedReceiver = "0x74c24Ba4747564dA871628127C4A54365eD8e1c5"
  const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

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
// npx hardhat ignition deploy ignition/modules/royaltyVaultProxy.ts --network sepolia --strategy create2 --verify  --include-unrelated-contracts
// 0x2076baC51d02012cCcf8612a0c0B4B7bcDD0D154

// npx hardhat ignition deploy ignition/modules/royaltyVaultProxy.ts --network mainnet --strategy create2 --verify
