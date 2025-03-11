// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (token/ERC721/IERC721.sol)

pragma solidity ^0.8.4;

interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @dev Required interface of an Bridge contract.
 */
interface IERC721Bridge is IERC165 {

    function safeMint(address to, uint256 tokenId, string memory uri ) external;

    function batchMint(address to, uint256[] memory tokenIds, string[] memory uris) external ;

    function batchSafeTransfer(address from, address to, uint256[] memory tokenIds) external ;

    function isTokenExists(uint256 tokenId) external view returns (bool) ;

    function batchMintOrUnlock(address toAddress, uint256[] memory tokenIds, string[] memory uris) external ;

}

