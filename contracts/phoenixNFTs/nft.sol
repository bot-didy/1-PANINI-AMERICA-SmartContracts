// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./openzeppelin/contracts/access/OwnableBasic.sol";
import "./limitbreak/ERC721C.sol";
import "./programmable-royalties/BasicRoyalties.sol";
import {AccessControl} from "./openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ERC721CWithBasicRoyalties
 * @author Limit Break, Inc.
 * @notice Extension of ERC721C that adds basic royalties support.
 * @dev These contracts are intended for example use and are not intended for production deployments as-is.
 */
contract PhoenixSports  is OwnableBasic, ERC721C, AccessControl, BasicRoyalties {

    bytes32 public constant PANINI_NFT_OPERATOR = keccak256("PANINI_NFT_OPERATOR");

    constructor(
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_,
        string memory name_,
        string memory symbol_)
        ERC721OpenZeppelin(name_, symbol_)
        Ownable(_msgSender())
        BasicRoyalties(royaltyReceiver_, royaltyFeeNumerator_) {

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(PANINI_NFT_OPERATOR, _msgSender());

    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721C,AccessControl, ERC2981) returns (bool) {
        return ERC721C.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }


    function safeMint(address to, uint256 tokenId, string memory uri) public onlyRole(PANINI_NFT_OPERATOR){
        require(!_exists(tokenId), "Token ID already exists");
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }


    function batchMint(address to, uint256[] memory tokenIds, string[] memory uris) external onlyRole(PANINI_NFT_OPERATOR) {
        require(to != address(0), "Invalid recipient");
        require(
            tokenIds.length == uris.length,
            "Token IDs and URIs length mismatch"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(!_exists(tokenIds[i]), "Token ID already exists");
            _mint(to, tokenIds[i]);
            _setTokenURI(tokenIds[i], uris[i]);
        }
    }

    function batchSafeTransfer(address from, address to, uint256[] memory tokenIds) external onlyRole(PANINI_NFT_OPERATOR) {
        require(to != address(0), "Invalid recipient");
        require(tokenIds.length > 0, "No token IDs provided");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                _isAuthorized(_msgSender(), from, tokenIds[i]),
                "Caller is not owner nor approved"
            );
            super.safeTransferFrom(from, to, tokenIds[i]);
        }
    }


    function burn(uint256 tokenId) public virtual override  {
        _burn(tokenId);
    }

    function pause() public onlyRole(PANINI_NFT_OPERATOR) {
        _pause();
    }

    function unpause() public onlyRole(PANINI_NFT_OPERATOR) {
        _unpause();
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public {
        _requireCallerIsContractOwner();
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public {
        _requireCallerIsContractOwner();
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }



}