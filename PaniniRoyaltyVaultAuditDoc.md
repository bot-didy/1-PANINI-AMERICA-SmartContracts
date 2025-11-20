# Panini Royalty Vault

## 1.1 Business Context

Panini America is the premier digital and physical sports collectibles brand, holding exclusive trading card licenses for the NFL, NBA, UFC, and global soccer leagues. As part of its digital collectibles expansion, Panini supports an interoperable NFT platform that bridges assets between a proprietary private blockchain and public EVM-compatible chains.

While NFTs are bridged to Ethereum and traded across public marketplaces, royalty revenue and platform fees generated in ETH and ERC20 tokens must be held securely and managed transparently. This is where the `PaniniRoyaltyVault` contract plays a critical role.

## 1.2 Purpose of This Document

This technical documentation outlines the architecture, behavior, and access model of the `PaniniRoyaltyVault` smart contract, which governs treasury operations such as ETH/ERC20 custody, controlled withdrawals, token swaps via Uniswap V3, and access whitelisting.

---

## 2. Vault Overview

### 2.1 Key Objectives

- Secure ETH/ERC20 Storage  
- Controlled, role-based withdrawals  
- Swapping volatile tokens to USDC or stable tokens (may be or may not be regular activity)
- whitelisted receivers, managers and pauser.
- Upgradeable contract using OpenZeppelin's Transparent Proxy Pattern  
- Pausable contract with emergency halting

### 2.2 Smart Contract Highlights

| Feature                  | Description                                                         |
|--------------------------|---------------------------------------------------------------------|
| Upgradeable Design       | Built using OpenZeppelin's proxy pattern (Initializable, Ownable)  |
| Role-Based Access        | Managers and receivers must be explicitly whitelisted by owner     |
| Token Swap Support       | Swaps ETH or ERC20 via Uniswap V3 Router                           |
| ETH/ERC20 Withdrawals    | Only whitelisted receivers may receive assets                      |
| Vault Manager Authorization | Vault managers control swap/withdraw/approve operations         |
| Pausable                 | VaultPauser,Owner can pause/unpause critical functions during emergencies       |

---

## 3. User Roles & Permissions


### Role Definitions

* **OWNER (Multisig)** → Super admin, pause, can manage roles i.e  update managers/whitelist receivers.
* **VAULT\_PAUSER** → Can pause/unpause all withdraw/swap activity for safety.
* **VAULT\_MANAGER** → Operates the vault (withdraw funds, do swaps) but only to **whitelisted receivers**.
* **WHITELISTED\_RECEIVER** → Only allowed to **receive** funds (cannot trigger vault actions).


### 3.1 Role Control Matrix

| Function                          | Owner | Vault Manager | Vault Pauser | Whitelisted Receiver |
| -------------------------------   | :---: | :-----------: | :----------: | :------------------: |
| initialize()                      |   ✅   |       ❌       |       ❌      |           ❌          |
| Add or remove VAULT_MANAGER       |   ✅   |       ❌       |       ❌      |           ❌          |
| Add or remove VAULT_PAUSER        |   ✅   |       ❌       |       ❌      |           ❌          |
| Add or remove WHITELISTED_RECEIVER|   ✅   |       ❌       |       ❌      |           ❌          |
| grant/revoke roles                |   ✅   |       ❌       |       ❌      |           ❌          |
| pause()/unpause()                 |   ✅   |       ❌       |       ✅      |           ❌          |
| withdrawETH()                     |   ❌   |       ✅       |       ❌      |  ✅ *(as recipient)*  |
| withdrawERC20()                   |   ❌   |       ✅       |       ❌      |  ✅ *(as recipient)*  |
| approveTokenForSwap()             |   ❌   |       ✅       |       ❌      |           ❌          |
| swapEthForToken()                 |   ❌   |       ✅       |       ❌      |  ✅ *(as recipient)*  |
| swapTokenForToken()               |   ❌   |       ✅       |       ❌      |  ✅ *(as recipient)*  |




* **Owner** is for governance, SafeWallet MultiSig Account.
* **Pauser** is for emergency stops.
* **Manager** is for execution.
* **Receivers** are pure beneficiaries.



---

## 4. Technical Stack

### 4.1 Programming Languages & Stack

| Component       | Technology Used                        |
|-----------------|-----------------------------------------|
| Smart Contract  | Solidity (v0.8.28)                      |
| Upgradeability  | OpenZeppelin Upgradeable Proxy Pattern |
| Token Swaps     | Uniswap V3 Router                       |
| Permissions     | Role-based via storage mappings        |
| Scripting       | Hardhat + Ethers + TypeScript (external only) |

---

### 4.2 Deployment Instructions

**Install dependencies:**

```bash
npm install
````

**Compile contracts:**

```bash
npx hardhat compile
```

**Deploy using upgradeable proxy pattern:**

```bash
npx hardhat ignition deploy ignition/modules/royaltyVaultProxy.ts --network <network> --strategy create2 --verify
```

**Upgrade using upgradeable proxy pattern:**

```bash
npx hardhat ignition deploy ignition/modules/updateRoyaltyVaultProxy.ts --network <network> --strategy create2 --verify
```
**Tests Run Instructions :**

* Run Entire Test Suite:

```bash
npx hardhat test test/PaniniRoyalty.test.ts
```

---

### 4.3 Key Contract Functions

#### ETH and ERC20 Withdrawals

* `withdrawETH(amount, receiver)`
* `withdrawERC20(token, receiver, amount)`

> Requires `msg.sender` to be a whitelisted vault manager
> Receiver must be in the approved whitelist

#### Token Swaps

* `swapEthForToken(amountIn, amountOutMin, outToken, recipient)`
* `swapTokenForToken(amountIn, amountOutMin, inToken, outToken, recipient)`

> Uses Uniswap V3 router for deterministic path-based swaps

#### Whitelist Management

* `updateVaultManager(address, bool)` — *owner only*
* `updateReceiverWhitelistStatus(address, bool)` — *owner only*

#### Token Approvals

* `setTokenAllowance(token, amount)` — grants router swap allowance

#### Emergency Pause

* `pause()` / `unpause()` — restricts withdrawal/swap functions during freeze

---

### 4.4 Events Emitted

| Event                              | Triggered By                     |
| ---------------------------------- | -------------------------------- |
| `Withdrawn()`                      | ETH withdrawal                   |
| `WithdrawnERC20()`                 | ERC20 token withdrawal           |
| `ETHSwappedForToken()`             | After ETH swap via Uniswap       |
| `TokrnSwappedForToken()`             | After ETH swap via Uniswap       |
| `VaultManagerAccessUpdated()`      | Owner updates vault manager list |
| `ReceiverWhitelistStatusChanged()` | Owner updates receiver whitelist |

---

### 4.5 Fallback and Receive Support

* Accepts native ETH deposits via `receive()`
* Has `fallback()` handler to accept plain calls

---

## 5. Limitations & Future Considerations

| Area            | Limitation/Note                                                 |
| --------------- | --------------------------------------------------------------- |
| Swap Router     | Relying on Uniswap V3, If uniswap not working, Txns might fails |
| No Fallback DEX | No Fallback DEXs for Swapping, if uniswap is not working.       |

---

## 6. Functional Summary

* ETH/ERC20 custody
* Controlled withdrawal system
* Uniswap V3 powered swaps (ETH → Token, Token → Token)
* Role-based security with upgradeability and pausability
* Safe, transparent event logging for audit trails

