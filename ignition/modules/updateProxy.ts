import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PROXY_ADMIN_CONTRACT_ADDRESS = "0xEb50AE00e3ddFF914c641843960ABfaB6c18fb59"
const UPGRADEABLE_PROXY_CONTRACT_ADDRESS = "0x75332cc11F60D5d0094cF96a8aA84F3012BaFA75"

// const PROXY_ADMIN_CONTRACT_ADDRESS = "0x12a6D6C41f126eCcAE823c213B2eEd3eec70f636"
// const UPGRADEABLE_PROXY_CONTRACT_ADDRESS = "0x66f6f4bA54539040C24D93eC51Da9a61822FBd4A"


const upgradeModule = buildModule("UpgradeModuleP6", (m) => {
    const proxyAdminOwner = m.getAccount(0);

    const nftV2 = m.contract("PaniniNFTs");

    const proxyAdmin = m.contractAt("ProxyAdmin", PROXY_ADMIN_CONTRACT_ADDRESS);
    const proxy = m.contractAt("TransparentUpgradeableProxy", UPGRADEABLE_PROXY_CONTRACT_ADDRESS);      
    
    m.call(proxyAdmin, "upgradeAndCall", [proxy, nftV2,"0x"], {
      from: proxyAdminOwner,
    });
  

  return { proxyAdmin, proxy };
});

export default upgradeModule;


// npx hardhat ignition deploy ignition/modules/updateProxy.ts --network polygonAmoy --verify
// npx hardhat ignition deploy ignition/modules/updateProxy.ts --network sepolia --verify

// ProxyModule#PhoenixNFTs - 0xDfea6d1dDE489bf129fBe45E68b0ef34A8261d36
// ProxyModule#TransparentUpgradeableProxy - 0x75332cc11F60D5d0094cF96a8aA84F3012BaFA75
// ProxyModule#ProxyAdmin - 0xEb50AE00e3ddFF914c641843960ABfaB6c18fb59
// UpgradeModuleP1#PhoenixNFTs - 0x3dc276fd78CFFc67Adec20d584Fa96A7dc78D15d
// UpgradeModuleP2#PhoenixNFTs - 0xE6F58506a202031d4eAc64157Bf1C023Ddf655E2
// UpgradeModuleP3#PhoenixNFTs - 0xAA5d1eEb49A37862a463f777Fe8934A2c6e4E260
// UpgradeModuleP4#PhoenixNFTs - 0x6e3F5257aa96B92C51Ee966f1aA63865bdDA750e
// UpgradeModuleP5#PaniniNFTs - 0x2FFdFb198Ea82F01bB770D188206A19D60B45E90
// UpgradeModuleP5#ProxyAdmin - 0xEb50AE00e3ddFF914c641843960ABfaB6c18fb59
// UpgradeModuleP5#TransparentUpgradeableProxy - 0x75332cc11F60D5d0094cF96a8aA84F3012BaFA75
// UpgradeModuleP6#PaniniNFTs - 0xf37231f65419Cd3A1841B1890210a41bA81D9E64
// UpgradeModuleP6#ProxyAdmin - 0xEb50AE00e3ddFF914c641843960ABfaB6c18fb59
// UpgradeModuleP6#TransparentUpgradeableProxy - 0x75332cc11F60D5d0094cF96a8aA84F3012BaFA75