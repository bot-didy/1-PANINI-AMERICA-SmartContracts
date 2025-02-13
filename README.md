# NFT Smart Contracts

This project contains the smart contracts for deploying and managing NFTs using Solidity and Hardhat.

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
npx hardhat test
```

### Deploy Contracts
Modify `ignition/modules/deploy.ts` and run:
```sh
npx hardhat ignition deploy ./ignition/modules/deploy.ts --network <your-network>

```

### Verify on Etherscan 

- [Verifying Guide](https://hardhat.org/hardhat-runner/docs/guides/verifying)


## 📜 NFT Contract Overview
- **`nft.sol`** → is plain NFT contract without whitelisted marketplace enforcement, royalties, and panini lock.
- **`NFTBridge.sol`** → Handles cross-chain NFT transfers with signature-based minting (yet to add)

## 🔗 Useful Resources
- [Hardhat Docs](https://hardhat.org/docs/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Ethers.js Docs](https://docs.ethers.org/)

## 📝 License
This project is licensed under the MIT License.

