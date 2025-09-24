import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const upgradeModule = buildModule("UpgradeRoyaltyModuleu1", (m) => {

  const proxyAdminOwner = m.getAccount(0);
  // const proxyAdminOwner = '0x7fa859B1E10782Ae660154F9e6b62Df8E2561476';

  const implementation = m.contract("RoyaltyVault");

  // const ProxyAdmin: any = m.contractAt("ProxyAdmin", "0x06bebd1166528a9035bb67a1c70c87057ce0ec59");

  // const proxy = m.contractAt("TransparentUpgradeableProxy", "0x2076bac51d02012cccf8612a0c0b4b7bcdd0d154")

  // const reinitializerData = m.encodeFunctionCall(implementation, "initializeAccessControl", [
  // ]);
  // m.call(ProxyAdmin, "upgradeAndCall", [proxy, implementation, reinitializerData], {
  //   from: proxyAdminOwner
  // });


  // m.call(ProxyAdmin, "upgradeAndCall", [proxy, implementation, "0x"], {
  //   from: proxyAdminOwner
  // });

  // const version2 = m.contractAt("PaniniRoyaltyVault2", proxy);


  // return { ProxyAdmin, proxy };
  return {implementation};

});

export default upgradeModule;

// npx hardhat ignition deploy ignition/modules/updateRoyaltyVaultProxy.ts --network sepolia --strategy create2 --verify
// npx hardhat ignition deploy ignition/modules/updateRoyaltyVaultProxy.ts --network polygonAmoy --strategy create2 --verify

// npx hardhat ignition deploy ignition/modules/updateRoyaltyVaultProxy.ts --network mainnet --strategy create2 --verify