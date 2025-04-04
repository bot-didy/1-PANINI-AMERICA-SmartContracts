const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");


async function deployProxyContract() {
    const initialOwner = "0x7fa859B1E10782Ae660154F9e6b62Df8E2561476";
    const receiver = "0x7fa859B1E10782Ae660154F9e6b62Df8E2561476";

    const NFT = await ethers.getContractFactory("PhoenixNFTs");
    const nft = await upgrades.deployProxy(NFT, 
        [initialOwner,receiver,1000],
        { initializer: "initialize" });

    await nft.waitForDeployment();
    const nftProxyAddress = await nft.getAddress()
    console.log("NFT Proxy deployed to:",nftProxyAddress );


    // Get the implementation contract address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(nftProxyAddress);
    console.log("NFT Implementation deployed to:", implementationAddress);

    // Verify contract on Etherscan
    console.log("Verifying contract...");
    await hre.run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
      });
    
    console.log("Verification successful!");

}

// deployProxyContract()


async function updateProxyContract() {
    const proxyAddress = "0x4B749Eee43E1998E5b264d5a161073611aC1fE3a";

    // Get the updated contract factory
    const NFT = await ethers.getContractFactory("PhoenixNFTs");

    console.log("Upgrading proxy contract...");

    // Upgrade the proxy contract
    const upgradedNFT = await upgrades.upgradeProxy(proxyAddress, NFT);

    await upgradedNFT.waitForDeployment();

    console.log("NFT Proxy upgraded at:", proxyAddress);

    // Get the new implementation contract address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("New NFT Implementation deployed at:", implementationAddress);

    // Verify new implementation contract on Etherscan
    console.log("Verifying new implementation contract...");
    await hre.run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
    });

    console.log("Verification successful!");
}

updateProxyContract();



// npx hardhat run scripts/deploy.ts --network sepolia
// npx hardhat run scripts/deployProxy.ts --network polygonAmoy


// 0x4B749Eee43E1998E5b264d5a161073611aC1fE3a