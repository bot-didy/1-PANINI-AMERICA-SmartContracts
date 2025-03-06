
import "@nomicfoundation/hardhat-verify";
const hre = require("hardhat");

const contractAddress = "0x470cc667d73074d1d017201d2c5e7c7a62a64d74";
async function main() {

    const collectionName = 'PNFTs'
    const collectionSymbol = 'PNFTs'
    const defaultAdmin = '0x7fa859B1E10782Ae660154F9e6b62Df8E2561476'

    await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [defaultAdmin,1000,collectionName,collectionSymbol],
    });

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


// 0x470Cc667d73074D1D017201D2C5e7C7a62A64D74
// npx hardhat verify ./ignition/modules/verify.ts --network polygonAmoy
// npx hardhat ignition verify 0x470Cc667d73074D1D017201D2C5e7C7a62A64D74
