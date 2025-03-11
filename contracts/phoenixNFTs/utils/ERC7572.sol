// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./IERC7572.sol";

/**
 * @title ERC-7572 Contract-Level Metadata
 * @dev Implements ERC-7572 for contract metadata management.
 */
contract ERC7572 is IERC7572 {
    /// @notice Stores the contract-level metadata URI.
    string private _contractURI;

    /**
     * @notice Initializes the contract with a metadata URI.
     * @param initialContractURI The initial metadata URI.
     */
    constructor(string memory initialContractURI) {
        _contractURI = initialContractURI;
    }

    /**
     * @notice Returns the contract metadata URI.
     * @return The contract metadata URI.
     */
    function contractURI() public view override returns (string memory) {
        return _contractURI;
    }

    /**
     * @notice Updates the contract metadata URI.
     * @dev Internal function to update the `_contractURI` variable.
     * It should be called within an authorized function (e.g., onlyOwner function).
     * Emits a {ContractURIUpdated} event.
     * @param newContractURI The new metadata URI to set.
     */
    function _setContractURI(string memory newContractURI) internal {
        _contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }

}
