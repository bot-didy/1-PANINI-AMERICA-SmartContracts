// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title ERC-7572: Contract-level Metadata
 * @dev Interface for contract-level metadata via `contractURI()`
 */
interface IERC7572 {
    /**
     * @notice Returns the metadata URI for the contract.
     * @dev This URI typically contains metadata describing the NFT collection.
     * @return A string representing the contract metadata URI.
     */
    function contractURI() external view returns (string memory);

    /**
     * @notice Emitted when the contract metadata URI is updated.
     * @param newContractURI The new metadata URI.
     */
    event ContractURIUpdated(string newContractURI);
}

