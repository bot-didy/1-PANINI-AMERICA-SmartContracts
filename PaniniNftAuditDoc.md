# 1. Panini America NFTs Overview

## 1.1 Business Context
Panini America is the official and exclusive trading card licensee for major U.S. sports leagues, including the NFL, NBA, UFC, and multiple international soccer organizations. Since 2020, Panini has operated a proprietary digital collectibles platform built on a Hyperledger Sawtooth private blockchain. The platform has achieved:

- 15+ million NFTs minted  
- 20+ million verified on-chain trade transactions  

Panini is now expanding to enable cross-chain interoperability by bridging NFTs from the Panini private blockchain to the Ethereum mainnet, with future support planned for other EVM-compatible chains. This move will:

- Enhance liquidity  
- Broaden user reach  
- Improve secondary market engagement  
- Preserve licensing controls and royalty flows  

## 1.2 Technical & Audit Scope
The smart contract is a custom extension of the ERC721C standard, developed to operate with a centralized, oracle-driven NFT bridge. Key enforcement goals include:

- Royalty enforcement  
- Marketplace whitelisting  
- One-chain NFT exclusivity (no duplicates)  
- Admin-signature-based authorization only  

The contract enforces Panini’s monetization and licensing rules on public chains, while ensuring NFTs are only active on one chain at a time.
#### Scope of Audit

* `PaniniNFTs.sol` (ERC721C + Bridge Logic)
* Include All Related helper libraries/interfaces

## 1.3 Key Functional Highlights

| Feature                     | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| Signature-Based Bridging   | NFTs can only be minted/unlocked/locked on Ethereum with a valid authorization from the centralized oracle. |
| Panini Lock Enforcement    | PaniniLock controls valid transfers and approvals. If Lock reset then any marketplace and delegate transfers allowed. |
| Whitelisted Marketplace Transfers | NFTs can only be traded via pre-approved marketplaces (e.g., OpenSea, Rarible). Delegated transfers from unapproved contracts are rejected. |


# 2. User Roles & Interactions

## 2.1 User Roles

| Role                  | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| End User              | NFT collectors or holders. Can lock NFTs for bridging, unlock NFTs from escrow, mint via signature, trade on whitelisted marketplaces, and burn tokens (if enabled). |
| PaniniNftOperator     | Off-chain role used by the centralized bridge service to sign authorized payloads for mint/unlock/lock operations. |
| PaniniNftManager      | Operational role for pausing/unpausing the contract and updating NFT metadata (e.g., fixing token URIs). |
| Whitelisted Marketplace | EVM-compatible marketplace contracts are allowed to execute delegate transfers on users' behalf. |
| Owner (Multisig)      | Governance role with full authority: manages role grants, sets royalty info, configures validator settings, and controls minting/burning toggles. |

## 2.2 Role-Based Function Access Matrix

| Contract Function / Action                   | End User | PaniniNftOperator | PaniniNftManager | Whitelisted Marketplace | Owner (Multisig) |
|---------------------------------------------|----------|-------------------|------------------|--------------------------|------------------|
| batchMintOrUnlock                           | ✅ (requires valid signature) | 🔒 (signs off-chain only) | ❌ | ❌ | ❌ |
| batchLockNFT                                 | ✅ (requires valid signature) | 🔒 (signs off-chain only) | ❌ | ❌ | ❌ |
| safeMint / batchMint                         | ❌ | ✅ (if mint enabled) | ❌ | ❌ | ❌ |
| updateTokenURI                               | ❌ | ❌ | ✅ | ❌ | ❌ |
| pause() / unpause()                          | ❌ | ❌ | ✅ | ❌ | ❌ |
| updateMintStatus() / updateBurnStatus()      | ❌ | ❌ | ❌ | ❌ | ✅ |
| burn(tokenId)                                | ✅ (if enabled & caller is owner) | ❌ | ❌ | ❌ | ❌ |
| approve() / setApprovalForAll() / transferFrom() | ✅ (only if operator is whitelisted) | ❌ | ❌ | ✅ (delegated transfer) | ❌ |
| setDefaultRoyalty()                          | ❌ | ❌ | ❌ | ❌ | ✅ |
| grantRole() / revokeRole()                   | ❌ | ❌ | ❌ | ❌ | ✅ |

## 2.3 Behavior Overview per Role

**End User**
- Initiates `batchMintOrUnlock()` with a valid signature to bridge NFTs into Ethereum or unlock escrowed NFTs.
- Initiates `batchLockNFT()` with a valid signature to bridge NFTs back to Panini.
- Can gift NFTs, burn them (if burn is enabled), and trade on approved marketplaces only.
- Can grant transfer approvals only to whitelisted operators.

**PaniniNftOperator**
- Signs payloads off-chain (not on-chain interaction).
- For mint/unlock: `batchMintOrUnlock(...)`
- For lock: `batchLockNFT(...)`
- Enforces replay protection and expiration via nonce/timestamp.
- Can mint NFTs if minting is enabled by owner.

**PaniniNftManager**
- Pauses/unpauses the contract.
- Updates metadata via `updateTokenURI()`.

**Whitelisted Marketplace**
- May be approved via `setApprovalForAll()` or `approve()` by users.
- Can perform `transferFrom()` on behalf of users — only if whitelisted.
- Any non-whitelisted operator is rejected via `custom _validateApproval() && ERC721c validateTransfer()`.

**Owner (Multisig)**
- Grants and revokes `PANINI_NFT_OPERATOR` and `PANINI_NFT_MANAGER` roles.
- Manages royalty info (`setDefaultRoyalty()`).
- Controls minting and burning toggles (`updateMintStatus()`, `updateBurnStatus()`).
- Acts as ultimate authority over contract settings and validator configurations.

## 2.4 Key Behavioral Rules

| Rule                     | Description                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| Signature Verification   | Mint, unlock, and lock actions must pass signature verification by an authorized operator. |
| Replay Protection        | Nonces (`requestNonce`) are single-use to prevent replay attacks. |
| Expiration Enforcement   | Signatures are valid only before their `expiredAt` timestamp. |
| Whitelisted Transfers Only | Marketplace interactions are restricted to pre-approved contract addresses. |
| Burning Controls         | Burn is possible only if enabled by the owner and initiated by the token holder. |
| Minting Controls         | Minting is allowed only if enabled by the owner and if `tokenId` hasn’t been used or burned. |
| Token Exclusivity        | A token can only exist on one chain at a time. |

# 3. System Behavior & Constraints

## 3.1 Bridge Flow Logic

- NFTs originate on the Panini private blockchain.
- When users bridge to Ethereum:
  - NFTs are locked on Panini, and an off-chain signature is generated.
- On Ethereum:
  - If the NFT does not exist, it is minted.
  - If held in escrow, it is unlocked and transferred to the user.
- When bridging back to Panini:
  - The user calls `batchLockNFT()` to transfer NFT to escrow.
  - Panini bridge server unlocks/mints it on the private chain.
- A given NFT exists on only one chain at a time.

## 3.2 Escrow Behavior

- **Ethereum ➝ Panini:** NFTs transferred from user to contract via `batchLockNFT()` only  
- **Panini ➝ Ethereum:** Escrowed NFTs returned to user via `batchMintOrUnlock()`  

## 3.3 Signature Payload Format

| Function            | Payload Format                                                                 |
|---------------------|---------------------------------------------------------------------------------|
| batchMintOrUnlock() | `abi.encode(chainId, _msgSender(), tokenIds, tokenURIs, requestNonce, expiredAt)` |
| batchLockNFT()      | `abi.encode(chainId, _msgSender(), tokenIds, requestNonce, expiredAt)`           |

- Signatures are generated off-chain by an address with the `PANINI_NFT_OPERATOR` role.
- Payloads include `chainId` to enable multi-chain compatibility.
- Signatures include `expiredAt` timestamp, making sure Signatures valid for a certain time (considering 10mins).

## 3.4 Request Nonce & Replay Protection

- `usedNonces` is a global mapping: `mapping(uint256 => bool) public usedNonces;`
- For each bridge request, a valid `requestNonce` is generated by bridge oracle/backend  
- Each `requestNonce` is single-use — reused nonces cause transaction reversion.
- Web2.5 friendly: multiple valid signatures per nonce possible (user can connect multiple wallets but only one active wallet at any point of time).
- Only the first successful tx with a `requestNonce` is accepted.

## 3.5 Token ID Generation

- Panini uses string IDs.  
- On Ethereum, a random 18–20 digit `uint256` `tokenId` is generated.  
- Mapping between Panini ID ↔ Ethereum `tokenId` is maintained off-chain.

## 3.6 Token Metadata Handling

- Metadata is permanent post-mint.
- Only `PANINI_NFT_MANAGER` can update via `updateTokenURI()` for rare fixes.

## 3.7 Royalty Enforcement

- Supports ERC2981 royalty standard.
- Set via `setDefaultRoyalty()` by the contract owner.
- Transfers honor royalty configuration.

## 3.8 Transfer Restrictions (Panini Smart Locks)

- Transfers allowed only to whitelisted marketplaces.
- Approvals and delegated transfers validated via `_validateApproval()`.
- Integrated with ERC721C validation patterns allow us guarantee royalties.

## 3.9 Burn Logic

- Burn allowed only if enabled by the owner.
- Token must be owned by the caller.
- Burned `tokenIds` are blacklisted permanently (cannot be reused).

## 3.10 Batch Processing Limits

- Max 25 NFTs per `batchMintOrUnlock()` or `batchLockNFT()` call.
- Off-chain signature generator typically batches 5 NFTs per request.
- Surge testing not yet benchmarked.

## 3.11 Chain Expansion Plan

- Contract supports deployment on other EVM chains.
- `chainId` used in payloads to distinguish context.
- Future rollout targets include Polygon, Base, etc.

## 3.12 Failure Handling and Event Tracking

- Emits:
  - `NFTBatchMintedOrUnlocked(requestNonce, owner, tokenIds)`
  - `NFTBatchLocked(requestNonce, owner, tokenIds)`
- Off-chain bridge infra relies on these to verify successful ops.
- Failures (e.g., expired signature, used nonce) require re-signing with a new nonce.

## 3.13 When Pause, Bridging Scenarios

- When contract pauses:
  - Locking should work, meaning moving back to Panini always works.
  - Rest of the NFT transfer activities are paused, strictly.
- Users can't simply send any Panini NFTs to the contract address — proper checks are there to prevent those transfers. As it acts as escrow and holds all locked NFTs, this check is added.

# 4. Technical Documentation – Panini NFT Smart Contracts

## 4.1 Programming Languages & Technologies Utilized

| Component           | Technology Used                            |
|---------------------|---------------------------------------------|
| Smart Contracts     | Solidity v0.8.28                            |
| Upgradeability      | @openzeppelin/contracts-upgradeable        |
| Framework           | Hardhat (with Ignition for proxy deployments) |
| Scripting Language  | TypeScript / JavaScript                     |
| Test Framework      | Chai                                        |
| On-chain Interaction| Ethers.js                                   |
| Dependency Manager  | Node.js & npm                               |

## 4.2 Usage of Third-Party Dependencies / Programs

| Dependency                         | Purpose                                                             |
|------------------------------------|---------------------------------------------------------------------|
| @openzeppelin/contracts-upgradeable | Provides base contracts for ERC721, AccessControl, and upgradeability |
| LimitBreak ERC721C                | Enforces royalty compliance and transfer restrictions               |
| @openzeppelin/hardhat-upgrades    | Upgradeable proxy deployments and verification support              |
| ethers.js                         | Interacts with deployed contracts                                   |
| chai                              | Assertion library used in testing                                   |
| dotenv                            | Loads environment variables                                         |

## 4.3 Development Environment Description

| Environment Component | Recommended Version         |
|------------------------|-----------------------------|
| Node.js               | v20.x or higher             |
| Solidity Compiler     | ^0.8.28                     |
| Hardhat               | ^2.22.0                     |
| OS Support            | macOS / Linux / Windows     |
| TypeScript            | For deployment/test scripts |

## 4.4 Setup & Deployment Instructions

```bash
# Install Project Dependencies
npm install

# Compile Contracts
npx hardhat compile

# Deploy and Verify on Sepolia (or testnet)
npx hardhat ignition deploy ignition/modules/deployProxy.ts --network sepolia --strategy create2 --verify

# Upgrading and Verify on Sepolia (or testnet)
npx hardhat ignition deploy ignition/modules/updateProxy.ts --network sepolia --strategy create2 --verify
```
⚠️ Benchmarking has not been tested or documented on Sepolia or any public testnet.

## 4.5 Run Instructions

| Task                      | Command                                        |
| ------------------------- | ---------------------------------------------- |
| Batch Mint or Unlock NFTs | `npx hardhat run scripts/batchMintOrUnlock.ts` |
| Lock NFTs to Escrow       | `npx hardhat run scripts/batchLock.ts`         |

## 4.6 Tests Run Instructions

* Run Entire Test Suite:

```bash
npx hardhat test test/PaniniNFTs.test.ts
```

## 4.7 Contract Architecture / Design

**Contract Design Highlights:**

* **Upgradeable Architecture**:
  Built using the Transparent Proxy pattern (OpenZeppelin’s upgradeable framework), enabling future logic upgrades while preserving storage and state.

* **Access Control**:
  Uses OpenZeppelin's AccessControl and Ownable modules. The owner role is held by a Safe multisig wallet, ensuring no single point of control over administrative functions.

* **Bridging Logic**:
  NFT minting, unlocking, and locking are driven by off-chain signatures from authorized operators.

  * `batchMintOrUnlock()` – Signature-based mint or unlock from Panini chain to Ethereum
  * `batchLockNFT()` – Locks NFTs for outbound bridging, moving back to Panini chain

* **Marketplace Whitelisting**:
  Transfers and approvals are restricted to whitelisted operators only, enforced via custom logic inside:

  * `setApprovalForAll()`
  * `approve()`
  * `transferFrom()`
  * `safeTransferFrom()`

* **Royalty & Compliance Enforcement**:
  Inherits from ERC721C (LimitBreak) and ERC2981, ensuring royalty rules and operator validation are enforced on-chain.
  * https://docs.opensea.io/docs/creator-fee-enforcement
  * https://github.com/limitbreakinc/creator-token-standards
  * https://apptokens.com/docs/integration-guide/creator-token-standards/v3/for-creators/transfer-security

* **Immutable Burn Logic**:
  Burned token IDs are permanently invalidated and cannot be reused.

## 4.8 Known Assumptions & Notes

* The **bridge oracle** is currently centralized and managed by Panini; future decentralization (e.g., Chainlink-based signing) is under consideration.
* The NFT **collection is global**, covering all Panini leagues and categories under a unified contract.
* Bridge logic ensures **NFT exists on only one chain** at any given time. The Panini chain and the off-chain bridge oracle are not considered external dependencies in the audit scope. Once an on-chain event on Ethereum succeeds (e.g., NFTBatchLocked, NFTBatchMintedOrUnlocked), the off-chain bridge is assumed to function correctly and act accordingly on the Panini private chain. 
* The current signature format uses keccak + ECDSA for hashing and signatures.
* EIP-712 Typed Data Signatures are likely considered for future versions to standardize signature verification across EVM networks.


