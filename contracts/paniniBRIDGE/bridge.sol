// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./interfaces/IERC721Bridge.sol";
import "./interfaces/IERC721Receiver.sol";
import "./cryptography/verifyByteSignature.sol";
import "./access/Ownable.sol";
import "./cryptography/ECDSA.sol";

/**
 * @title NFTBridge
 * @dev A contract for bridging ERC721 NFTs across blockchain networks.
 * Allows minting/unlocking and locking of NFTs with signature verification.
 */
contract NFTBridge is Ownable, VerifyByteSignature, IERC721Receiver {
    using ECDSA for bytes32;

    /// @notice Address of the authorized bridge signer
    address public bridgeSigner;

    /// @notice Mapping to track whitelisted NFT collections
    mapping(address => bool) public whiteListedCollection;

    /// @notice Mapping to track used nonces to prevent replay attacks
    mapping(uint256 => bool) public usedNonces;

    /// @notice Event emitted when NFTs are minted or unlocked
    event NFTBatchMintedOrUnlocked(address indexed collection, address indexed owner, uint256[] tokenIds);
    
    /// @notice Event emitted when NFTs are locked for bridging
    event NFTBatchLocked(address indexed collection, address indexed owner, uint256[] tokenIds);

    /**
     * @dev Initializes the NFTBridge contract.
     * @param _bridgeSigner The address of the bridge signer.
     * @param _initialOwner The initial owner of the contract.
     */
    constructor(address _bridgeSigner, address _initialOwner) Ownable(_initialOwner) {
        bridgeSigner = _bridgeSigner;
    }

    /**
     * @dev Handles the receipt of an ERC721 token.
     * @return The selector confirming the receipt.
     */
    function onERC721Received(address, address, uint256, bytes calldata) public pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Mints or unlocks a batch of NFTs based on a valid signature.
     * @param collection The NFT collection address.
     * @param toAddress The recipient address.
     * @param tokenIds The token IDs to mint/unlock.
     * @param tokenURIs The metadata URIs of the tokens.
     * @param requestNonce The unique nonce for this request.
     * @param signature The signature verifying the request.
     */
    function batchMintOrUnlock(
        address collection,
        address toAddress,
        uint256[] calldata tokenIds,
        string[] calldata tokenURIs,
        uint256 requestNonce,
        bytes calldata signature
    ) external {
        require(tokenIds.length == tokenURIs.length, "Input array lengths mismatch");
        require(whiteListedCollection[collection], "Not whitelisted collection");
        require(!usedNonces[requestNonce], "Nonce already used");
        usedNonces[requestNonce] = true;

        bytes memory message = abi.encode(collection, toAddress, tokenIds, tokenURIs, requestNonce);
        require(_verifySignature(message, signature), "Invalid signature");

        IERC721Bridge nft = IERC721Bridge(collection);
        nft.batchMintOrUnlock(toAddress, tokenIds, tokenURIs);

        emit NFTBatchMintedOrUnlocked(collection, toAddress, tokenIds);
    }

    /**
     * @dev Locks a batch of NFTs to bridge them to another network.
     * @param collection The NFT collection address.
     * @param tokenIds The token IDs to lock.
     * @param requestNonce The unique nonce for this request.
     * @param signature The signature verifying the request.
     */
    function batchLockNFT(address collection,uint256[] calldata tokenIds,uint256 requestNonce,bytes calldata signature) external {
        require(whiteListedCollection[collection], "Not whitelisted collection");
        require(!usedNonces[requestNonce], "Nonce already used");
        usedNonces[requestNonce] = true;

        bytes memory message = abi.encode(collection, tokenIds, requestNonce, _msgSender());
        require(_verifySignature(message, signature), "Invalid signature");

        IERC721Bridge nft = IERC721Bridge(collection);

        nft.batchSafeTransfer(_msgSender(), address(this), tokenIds);

        emit NFTBatchLocked(collection, _msgSender(), tokenIds);
    }

    /**
     * @dev Updates the bridge signer address. Only callable by the owner.
     * @param newSigner The new bridge signer address.
     */
    function setBridgeSigner(address newSigner) external onlyOwner {
        bridgeSigner = newSigner;
    }

    /**
     * @dev Checks if an NFT contract supports a given interface.
     * @param nft The NFT contract address.
     * @param interfaceId The interface ID to check.
     * @return True if supported, otherwise false.
     */
    function _supportsInterface(IERC721Bridge nft, bytes4 interfaceId) internal view returns (bool) {
        (bool success, bytes memory result) = address(nft).staticcall(
            abi.encodeWithSelector(nft.supportsInterface.selector, interfaceId)
        );
        return success && result.length > 0 && abi.decode(result, (bool));
    }

    /**
     * @dev Whitelists multiple NFT collections. Only callable by the owner.
     * @param collections The addresses of NFT collections to whitelist.
     */
    function addCollections(address[] calldata collections) external onlyOwner {
        for (uint256 i = 0; i < collections.length; i++) {
            require(collections[i] != address(0), "Invalid collection address");
            require(!whiteListedCollection[collections[i]], "Already whitelisted");
            whiteListedCollection[collections[i]] = true;
        }
    }

    /**
     * @dev Removes multiple NFT collections from the whitelist. Only callable by the owner.
     * @param collections The addresses of NFT collections to remove.
     */
    function removeCollections(address[] calldata collections) external onlyOwner {
        for (uint256 i = 0; i < collections.length; i++) {
            require(collections[i] != address(0), "Invalid collection address");
            require(whiteListedCollection[collections[i]], "Collection not in whitelist");
            whiteListedCollection[collections[i]] = false;
        }
    }

    /**
     * @dev Checks if an NFT collection is whitelisted.
     * @param collection The address of the collection.
     * @return True if whitelisted, otherwise false.
     */
    function isCollectionWhitelisted(address collection) external view returns (bool) {
        return whiteListedCollection[collection];
    }

    /**
     * @dev Checks if a token exists in a given collection.
     * @param collection The NFT collection address.
     * @param tokenId The token ID to check.
     * @return True if the token exists, otherwise false.
     */
    function exists(address collection, uint256 tokenId) public view returns (bool) {
        return IERC721Bridge(collection).isTokenExists(tokenId);
    }

    /**
     * @dev Verifies a signature using the bridge signer.
     * @param message The encoded message.
     * @param signature The signature to verify.
     * @return True if valid, otherwise false.
     */
    function _verifySignature(bytes memory message, bytes memory signature) internal view returns (bool) {
        return VerifyByteSignature.verifySigner(bridgeSigner, message, signature);
    }
}
