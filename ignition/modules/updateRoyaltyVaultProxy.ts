import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const upgradeModule = buildModule("UpgradeRoyaltyModule", (m) => {

  const proxyAdminOwner = m.getAccount(0);
  // const proxyAdminOwner = '0x7fa859B1E10782Ae660154F9e6b62Df8E2561476';

  const implementation = m.contract("PaniniRoyaltyVault");

  const ProxyAdmin:any = m.contractAt("ProxyAdmin", "0x6a77D0E825A6C88ff7ab08dfb30FAbFB3B6fCd15");

  const proxy = m.contractAt("TransparentUpgradeableProxy", "0xB62A7Ff5488aCB7212beC5A24FD3491680664F02")

  m.call(ProxyAdmin, "upgradeAndCall", [proxy, implementation ,"0x"], {
    from: proxyAdminOwner
  });

  // const version2 = m.contractAt("PaniniRoyaltyVault2", proxy);
  

  return { ProxyAdmin, proxy  };
});

export default upgradeModule;

//npx hardhat ignition deploy ignition/modules/updateRoyaltyVaultProxy.ts --network sepolia --strategy create2 --verify