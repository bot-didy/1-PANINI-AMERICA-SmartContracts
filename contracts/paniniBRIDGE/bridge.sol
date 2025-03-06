// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./interfaces/IERC721.sol";
import "./cryptography/verifyByteSignature.sol";
import "./access/Ownable.sol";
import "./cryptography/ECDSA.sol";
// import "hardhat/console.sol";

contract NFTBridge is Ownable, VerifyByteSignature {
    using ECDSA for bytes32;

    address public bridgeSigner;
    mapping(address => mapping(uint256 => bool)) public lockedTokens;
    mapping(address => bool) public whiteListedCollection;
    mapping(uint256 => bool) public usedNonces;

    event NFTMinted(address indexed collection,address indexed owner,uint256 tokenId);
    event NFTLocked(address indexed collection, uint256 tokenId);
    event NFTUnlocked(address indexed collection,address indexed owner,uint256 tokenId);


    /**
     * @dev Initializes the contract with a bridge signer and an owner.
     * @param _bridgeSigner Address responsible for signing cross-chain transactions.
     * @param _initialOwner Address of the contract owner.
     */
    constructor(address _bridgeSigner, address _initialOwner)
        Ownable(_initialOwner) {
        bridgeSigner = _bridgeSigner;
    }


    /**
     * @dev Mints an NFT if it does not already exist.
     * Ensures that the collection is whitelisted and the signature is valid.
     * @param collection Address of the NFT collection.
     * @param to Recipient address of the newly minted NFT.
     * @param tokenId Unique token ID for the NFT.
     * @param tokenURI Metadata URI for the NFT.
     * @param requestNonce Unique nonce to prevent replay attacks.
     * @param signature Signed message verifying authenticity.
     */
    function safeMint(address collection,address to,uint256 tokenId,string calldata tokenURI,uint256 requestNonce,bytes calldata signature) external {
        require(whiteListedCollection[collection],"Not whiteListed collection");
        bytes memory message = abi.encodePacked(collection,to,tokenId,tokenURI,requestNonce);
        require(_verifySignature(message, signature), "Invalid signature");
        require(!exists(collection, tokenId), "NFT already exists");
        require(!lockedTokens[collection][tokenId], "NFT locked");

        IERC721 nft = IERC721(collection);
        // **Mint the NFT**
        nft.safeMint(to, tokenId, tokenURI);
        emit NFTMinted(collection, to, tokenId);
    }

    /**
     * @dev Unlocks a previously locked NFT and transfers it to the recipient.
     * Ensures the NFT exists, is locked, and the signature is valid.
     * @param collection Address of the NFT collection.
     * @param to Recipient address for the unlocked NFT.
     * @param tokenId Unique token ID to unlock.
     * @param requestNonce Unique nonce to prevent replay attacks.
     * @param signature Signed message verifying authenticity.
     */
    function unlockNFT(address collection,address to,uint256 tokenId,uint256 requestNonce,bytes calldata signature) external {
        require(whiteListedCollection[collection],"Not whiteListed collection");
        require(exists(collection, tokenId), "NFT does not exists");
        require(lockedTokens[collection][tokenId], "NFT is not locked");
        bytes memory message = abi.encode(collection,to,tokenId,requestNonce);
        require(_verifySignature(message, signature), "Invalid signature");

        IERC721 nft = IERC721(collection);
        // **Unlock the NFT**
        lockedTokens[collection][tokenId] = false;
        nft.safeTransferFrom(address(this), to, tokenId);
        emit NFTUnlocked(collection, to, tokenId);
    }

    /**
     * @dev Locks an NFT in the contract to enable cross-chain bridging.
     * Ensures the NFT exists, is not already locked, and the signature is valid.
     * @param collection Address of the NFT collection.
     * @param tokenId Unique token ID to lock.
     * @param requestNonce Unique nonce to prevent replay attacks.
     * @param signature Signed message verifying authenticity.
     */
    function lockNFT(address collection,uint256 tokenId,uint256 requestNonce,bytes calldata signature) external {
        require(whiteListedCollection[collection],"Not whiteListed collection");
        bytes memory message = abi.encode(collection,tokenId,requestNonce);
        require(_verifySignature(message, signature), "Invalid signature");
        require(exists(collection, tokenId), "NFT does not exists");
        require(!lockedTokens[collection][tokenId], "NFT already locked");

        IERC721 nft = IERC721(collection);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        lockedTokens[collection][tokenId] = true;
        nft.transferFrom(msg.sender, address(this), tokenId);
        emit NFTLocked(collection, tokenId);
    }

    /**
     * @dev Mints or unlocks multiple NFTs in a batch process.
     * @param collection Address of the NFT collection.
     * @param toAddress Recipient address.
     * @param tokenIds Array of NFT token IDs.
     * @param tokenURIs Array of metadata URIs corresponding to token IDs.
     * @param requestNonce Unique nonce to prevent replay attacks.
     * @param signature Signed message verifying authenticity.
     */
    function batchMintOrUnlock(address collection,address toAddress, uint256[] memory tokenIds,string[] memory tokenURIs,
        uint256 requestNonce,bytes memory signature) external {
        require(tokenIds.length == tokenURIs.length,"Input array lengths mismatch");
        require(whiteListedCollection[collection],"Not whiteListed collection");

        // **Ensure nonce is not reused**
        require(!usedNonces[requestNonce], "Nonce already used");
        bytes memory message = abi.encode(collection,toAddress,tokenIds,tokenURIs,requestNonce);        
        require(_verifySignature(message, signature), "Invalid signature");
        usedNonces[requestNonce] = true; // Mark nonce as used


        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            string memory tokenURI = tokenURIs[i];
            IERC721 nft = IERC721(collection);
            
            if (exists(collection, tokenId)) {
                // **Unlock the NFT**
                require(lockedTokens[collection][tokenId], "NFT is not locked");
                require(nft.ownerOf(tokenId) == address(this), "NFT ownership mismatch");                
                
                lockedTokens[collection][tokenId] = false;
                nft.transferFrom(address(this), toAddress, tokenId);
                emit NFTUnlocked(collection, toAddress, tokenId);
            } else {
                // **Mint the NFT**
                // require(!exists(collection, tokenId), "NFT already exists");
                nft.safeMint(toAddress, tokenId, tokenURI);
                emit NFTMinted(collection, toAddress, tokenId);
            }
        }
    }

    /**
     * @dev Locks multiple NFTs in the contract for cross-chain bridging.
     * Ensures the NFT collection is whitelisted, tokens exist, are not already locked,
     * and the caller is the rightful owner. Uses a signature for validation.
     *
     * @param collection Address of the NFT collection.
     * @param tokenIds Array of NFT token IDs to be locked.
     * @param requestNonce Unique nonce to prevent replay attacks.
     * @param signature Signed message verifying authenticity.
     */
    function batchLockNFT(address collection, uint256[] calldata tokenIds, uint256 requestNonce, bytes calldata signature) external {
        require(whiteListedCollection[collection], "Not whiteListed collection");
        bytes memory message = abi.encode(collection, tokenIds, requestNonce);
        require(_verifySignature(message, signature), "Invalid signature");

        IERC721 nft = IERC721(collection);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(exists(collection, tokenId), "NFT does not exist");
            require(!lockedTokens[collection][tokenId], "NFT already locked");
            require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");

            lockedTokens[collection][tokenId] = true;
            nft.transferFrom(msg.sender, address(this), tokenId);
            emit NFTLocked(collection, tokenId);
        }
    }

    function setBridgeSigner(address newSigner) external onlyOwner {
        bridgeSigner = newSigner;
    }

    function _supportsInterface(IERC721 nft, bytes4 interfaceId) internal view returns (bool) {
        (bool success, bytes memory result) = address(nft).staticcall(
            abi.encodeWithSelector(nft.supportsInterface.selector, interfaceId)
        );
        return success && result.length > 0 && abi.decode(result, (bool));
    }

    /**
     * @dev Adds a collection to the whitelist.
     * Can only be called by the contract owner.
     */
    function addCollection(address collection) external onlyOwner {
        require(collection != address(0), "Invalid collection address");
        require(!whiteListedCollection[collection], "Collection already whitelisted");

        whiteListedCollection[collection] = true;
    }

    /**
     * @dev Removes a collection from the whitelist.
     * Can only be called by the contract owner.
     */
    function removeCollection(address collection) external onlyOwner {
        require(whiteListedCollection[collection], "Collection not in whitelist");

        whiteListedCollection[collection] = false;
    }

    /**
     * @dev Checks if a collection is whitelisted.
     */
    function isCollectionWhitelisted(address collection) external view returns (bool) {
        return whiteListedCollection[collection];
    }

    /**
     * @dev Checks whether a given NFT exists in the specified collection.
     * @param collection Address of the NFT collection.
     * @param tokenId Unique token ID.
     * @return Boolean indicating if the NFT exists.
     */
    function exists(address collection, uint256 tokenId) public view returns (bool){
        return IERC721(collection).isTokenExists(tokenId);
    }

    /**
     * @dev Verifies a signed message using the bridge signer.
     * @param message Encoded message data.
     * @param signature Signed message.
     * @return Boolean indicating whether the signature is valid.
     */
    function _verifySignature(bytes memory message, bytes memory signature) internal view returns (bool){
        return VerifyByteSignature.verifySigner(bridgeSigner, message, signature);
    }
}
