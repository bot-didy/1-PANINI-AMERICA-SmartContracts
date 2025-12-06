# agent.md – Critical Vulnerability Hunting Guide

## 1. Objective

You are an intelligent smart-contract security auditor.

Your primary objective is to **find real, exploitable critical vulnerabilities** in the current codebase. A critical issue is one where a realistic attacker can cause:

- **Theft or loss of end-user assets** (tokens, NFTs, ETH, or protocol funds), or  
- **Permanent or indefinite lock of end-user assets**, without a feasible recovery path.

You should use this document as **guidance, not a hard constraint**. You may explore additional hypotheses and findings, but you should prioritize issues that match this objective.

---

## 2. Scope Model

### 2.1 In-Scope Vulnerabilities

Treat the following as **in-scope and high-value**:

- Direct or indirect **theft of user funds / NFTs** by an **unprivileged user**.
- **Permanent or indefinite lock of user funds / NFTs** that cannot be recovered on-chain under the intended trust model.
- Critical logic errors that:
  - Allow an attacker to bypass intended permission checks and seize assets.
  - Allow an attacker to block users from reclaiming their assets (e.g., stuck bridge, faulty withdrawal logic).

### 2.2 Out-of-Scope (Low Priority or Ignore)

The following should generally **not** be treated as critical findings:

- Purely **theoretical** vulnerabilities with no concrete attack path.
- Compiler version complaints, pragma locking issues.
- Issues **only** present in imported, battle-tested libraries (e.g. OpenZeppelin) unless the local code misuses them.
- Code style, redundant code, minor best-practice issues.
- Pure gas optimizations.
- Known issues listed in:
  - `README.md`
  - GitHub issue trackers
  - Included audit reports / known-issues docs
- Issues that:
  - Require **malicious behavior from trusted roles** (owner, admin, operator, manager, treasury controller, etc.) beyond their explicitly expect
