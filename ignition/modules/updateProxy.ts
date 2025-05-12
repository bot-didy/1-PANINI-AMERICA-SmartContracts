import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PROXY_ADMIN_CONTRACT_ADDRESS = "0xEb50AE00e3ddFF914c641843960ABfaB6c18fb59"
const UPGRADEABLE_PROXY_CONTRACT_ADDRESS = "0x75332cc11F60D5d0094cF96a8aA84F3012BaFA75"

// const PROXY_ADMIN_CONTRACT_ADDRESS = "0x12a6D6C41f126eCcAE823c213B2eEd3eec70f636"
// const UPGRADEABLE_PROXY_CONTRACT_ADDRESS = "0x66f6f4bA54539040C24D93eC51Da9a61822FBd4A"


const upgradeModule = buildModule("UpgradeModuleP2", (m) => {
    const proxyAdminOwner = m.getAccount(0);

    const nftV2 = m.contract("PhoenixNFTs");

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
// UpgradeModuleP1#PhoenixNFTs - 0x3dc276fd78CFFc67Adec20d584Fa96A7dc78D15d
// UpgradeModuleP2#PhoenixNFTs - 0xE6F58506a202031d4eAc64157Bf1C023Ddf655E2
// npx hardhat ignition deploy ignition/modules/updateProxy.ts --network sepolia --verify
