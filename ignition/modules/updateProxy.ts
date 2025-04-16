import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PROXY_ADMIN_CONTRACT_ADDRESS = "0x2C2c52C631925be9904c107e091a97621e816592"
const UPGRADEABLE_PROXY_CONTRACT_ADDRESS = "0x48E22ACA83480EC65550cDB7C96bF32c6BcefF47"

const upgradeModule = buildModule("UpgradeModule", (m) => {
    const proxyAdminOwner = m.getAccount(0);

    const nftV2 = m.contract("PhoenixNFTs2");

    const proxyAdmin = m.contractAt("ProxyAdmin", PROXY_ADMIN_CONTRACT_ADDRESS);
    const proxy = m.contractAt("TransparentUpgradeableProxy", UPGRADEABLE_PROXY_CONTRACT_ADDRESS);      
    
    m.call(proxyAdmin, "upgradeAndCall", [proxy, nftV2,"0x"], {
      from: proxyAdminOwner,
    });
  

  return { proxyAdmin, proxy };
});

export default upgradeModule;


// npx hardhat ignition deploy ignition/modules/updateProxy.ts --network polygonAmoy --verify

// ProxyModule#PhoenixNFTs - 0xDfea6d1dDE489bf129fBe45E68b0ef34A8261d36
// ProxyModule#TransparentUpgradeableProxy - 0x75332cc11F60D5d0094cF96a8aA84F3012BaFA75
// ProxyModule#ProxyAdmin - 0xEb50AE00e3ddFF914c641843960ABfaB6c18fb59