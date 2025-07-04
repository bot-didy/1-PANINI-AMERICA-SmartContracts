## 🔍 Audit Overview: Panini NFT Bridge

### 🏢 Project Background

**Panini America** is the official and exclusive trading card licensee for major U.S. sports leagues, including the **NFL, NBA, UFC, and international soccer** organizations. Panini’s digital collectibles platform operates on a **private blockchain (Hyperledger Sawtooth)** and has successfully minted **over 15 million NFTs**, with more than **20 million on-chain trade transactions**.

### 📘 Project Description

The `PaniniNFTs.sol` contract is an extended **ERC721C** implementation integrated with a **centralized bridge mechanism**, enabling **secure, signature-based NFT bridging** from the Panini private blockchain to the **Ethereum mainnet** (and potentially other EVM-compatible networks in the future). This contract includes **royalty enforcement**, **whitelisted marketplace controls**, and **transfer restrictions** to ensure compliance with Panini’s licensing and monetization policies.

### 🔍 Scope of Audit

* `PaniniNFTs.sol` (ERC721C + Bridge Logic)
* Include All Related helper libraries/interfaces


### 🚀 Key Features

* ✅ **Signature-Based Bridging (Mint,Lock,Unlock)**

  * One-time mint/unlock using authorized oracle signatures

* ✅ **Panini Lock Enforcement**

  * Prevents unauthorized transfers duplicates.

* ✅ **Whitelisted Marketplace Transfers**

  * Only approved marketplaces can do delegate transfer of NFTs

* ✅ **Role-Based Controls**

  * Fine-grained permissions (Owner, Manager, Operator)

* ✅ **Royalty Routing (via Vault)**

  * Royalties collected and routed using Uniswap V2-based vault contract

### 🔐 Roles & Access Control

| Role            | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| **Owner**       | Safe wallet with full administrative control                       |
| **Manager**     | Emergency role (pause/unpause, update tokenURI in rare cases)      |
| **Operator**    | Oracle signer responsible for minting, locking, and unlocking NFTs |
| **Marketplace** | Approved addresses whitelisted to facilitate compliant transfers   |

### 📍 Deployed Contracts (Sepolia Testnet)

* `ERC721CPhoenix` (PaniniNFTs): `0x...`
* `PaniniRoyaltyVault`: `0x...`

*Production deployment to Ethereum mainnet is pending audit completion.*

### Compiler Configuration

* **Solidity Version**: `^0.8.28`
* **Optimizer**: Enabled (`runs: 200`)

### Known Assumptions & Notes

* The **bridge oracle** is currently centralized and managed by Panini; future decentralization (e.g., Chainlink-based signing) is under consideration.
* The NFT **collection is global**, covering all Panini leagues and categories under a unified contract.
* Bridge logic ensures **NFT exists on only one chain** at any given time.
