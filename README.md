## Project Overview: Panini NFT Smart Contracts

The PaniniNFTs.sol is ERC721C + Centralised Bridge allows secure, signature-based bridging of NFTs from a Private Panini Blockchain (Hyperledger Sawtooth) to Ethereum mainnet ( or in future any EVM blockchain), with enforced royalty & whitelisting controls for marketplaces.

## 🛠️ Project Setup

### 1️⃣ Install Dependencies
```sh
npm install
```

### 2️⃣ Configure Environment Variables
Use example.env and Create a `.env` file and update or add variables

## 🚀 Hardhat Commands

### Compile Smart Contracts
```sh
npx hardhat compile
```

### Run Tests
```sh
npx hardhat test test/PhoenixNfts.test.ts
npx hardhat test test/PaniniRoyalty.test.ts

```

### Deploy Contracts
run to deploy contract :
```sh
npx hardhat ignition deploy ./ignition/modules/deployProxy.ts --network <your-network>

```

### Deploy Contracts
run to upgrade contract :
```sh
npx hardhat ignition deploy ./ignition/modules/upgradeProxy.ts --network <your-network>

```

### Verify on Etherscan 

- [Verifying Guide](https://hardhat.org/hardhat-runner/docs/guides/verifying)


 ## 📜 NFT Contract Overview
- **`PaniniNFTs.sol`** 
    → is NFT contract whitelisted marketplace enforcement, royalties enforcement.
    → Handles cross-chain NFT transfers with signature-based bridging requests.

 ## 📜 RoyaltyVault Contract Overview
- **`PaniniRoyaltyVault.sol`** 
    → Its a On-chain Simple Smart Contract Account to receive royalties from whitelisted marketplaces.
    → VaultManager can swap using uniswap and withdraw funds to whitelistedReceivers.


## 🔗 Useful Resources
- [Hardhat Docs](https://hardhat.org/docs/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Ethers.js Docs](https://docs.ethers.org/)

## 📝 License
This project is licensed under the MIT License.

