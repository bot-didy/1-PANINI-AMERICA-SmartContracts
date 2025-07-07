
## Audit Overview: Panini Royalty Vault

### Project Background

Panini’s NFT platform facilitates sports collectibles trading across leagues like NFL, NBA, UFC, and Soccer. The ecosystem includes an NFT bridge, private-to-public chain transfers, and royalty management. This document outlines the vault mechanism designed to **securely hold, manage, and swap** ETH and ERC20 tokens related to royalties and platform fees.

### Vault Description

`PaniniRoyaltyVault.sol` is an **upgradeable**, role-based smart contract that functions as a **secure treasury** for holding royalties and executing swaps. It supports:

* ETH & ERC20 storage
* Controlled withdrawals
* Token swaps via Uniswap V2
* Role-based access control
* Emergency pause mechanism

The vault’s primary purpose is to collect and hold royalty revenues, convert volatile tokens to USDC (or stable tokens), and **only allow pre-approved withdrawals to whitelisted addresses.**


### Scope for Audit

* `PaniniRoyaltyVault.sol`

> Note: This contract works in conjunction with `PaniniNFTs` but is scoped independently for audit.



### Key Features

| Feature                       | Description                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- |
| **Secure Treasury Vault**     | On-chain ETH/ERC20 storage for managing royalties and platform revenue       |
| **Role-Based Access Control** | `Owner` (Safe Wallet/multisig) and `Vault Managers` have distinct privileges |
| **Token & ETH Swaps**         | Integrated with **Uniswap V2 Router** to convert assets to USDC              |
| **Whitelisted Withdrawals**   | Withdrawals only allowed to **owner-approved receiver addresses**            |
| **Emergency Controls**        | Pausable vault logic for swap/withdrawal lockdown in critical scenarios      |
| **Upgradeable Contract**      | Built using OpenZeppelin upgradeable patterns                                |



### Roles & Permissions

| Role              | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| **Owner**         | Safe wallet (e.g., Gnosis Safe); full administrative rights |
| **Vault Manager** | Authorized by owner to perform swaps and withdrawals        |
| **Receiver**      | Whitelisted address to which assets can be sent             |

---

### Technical Stack

* **Solidity Version**: `^0.8.28`
* **Framework**: OpenZeppelin Upgradeable Contracts
* **DEX**: Uniswap V2 Router

---

### Key Contracts & Components

| Contract                 | Responsibility                                                  |
| ------------------------ | --------------------------------------------------------------- |
| `PaniniRoyaltyVault.sol` | ETH/ERC20 asset management, access control, Uniswap integration |
| `IUniswapV2Router02`     | External interface for Uniswap V2 swap operations               |
| `OwnableUpgradeable`     | Upgradeable admin control for ownership                         |
| `PausableUpgradeable`    | Emergency control for critical function halt                    |


### Functionality Summary

| Function                                | Description                                                        |
| --------------------------------------- | ------------------------------------------------------------------ |
| `withdrawETH()`                         | Vault Managers withdraw ETH to whitelisted addresses               |
| `withdrawERC20()`                       | Vault Managers withdraw ERC20 tokens to approved receivers         |
| `swapEthForToken()`                     | Swaps ETH to token using Uniswap and sends to whitelisted receiver |
| `swapTokenForToken()`                   | Swaps ERC20 → ERC20 and routes to whitelisted recipient            |
| `approveTokenForSwap()`                 | Approves router for swapping token amounts                         |
| `updateVaultManager()`                  | Owner adds/removes vault managers                                  |
| `updateReceiverWhitelist()`             | Owner adds/removes receiver whitelist entries                      |
| `pause()` / `unpause()`                 | Owner can toggle all sensitive functions                           |
| `getEthBalance()` / `getTokenBalance()` | View current vault balances                                        |


### Known Assumptions / Notes

* **Multisig Ownership Recommended**: The contract assumes `owner` will be a **Safe Wallet or similar multisig** to minimize risk.
* **Manual Whitelisting**: Asset recipients and operators must be added by the owner beforehand.
* **No Slippage Handling**: Swaps assume acceptable slippage is pre-calculated by vault managers.
* **Non-Upgradeable Proxy Deployment Required**: Ensure deployment via proxy pattern to retain upgradeability.


