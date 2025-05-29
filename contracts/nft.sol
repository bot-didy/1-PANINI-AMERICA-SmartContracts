// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721Upgradeable, IERC721} from "./openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "./openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "./openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {ERC721PausableUpgradeable} from "./openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import {ERC721URIStorageUpgradeable} from "./openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {Initializable} from "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Ownable2StepUpgradeable} from "./openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ERC2981Upgradeable} from "./openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import {AccessControlUpgradeable} from "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {SmartValidator} from "./smartlocks/SmartValidator.sol";
import {CreatorTokenValidator} from "./limitbreak/CreatorTokenValidator.sol";
import {VerifyByteSignature} from "./openzeppelin/contracts/utils/VerifyByteSignature.sol";

/// @title PhoenixNFTs - An upgradeable ERC721 contract with extended features like pausing, burning, royalties, role-based access, and signature-based minting/unlocking
/// @notice This contract allows controlled minting, locking, and unlocking of NFTs using off-chain signatures with replay protection
/// @dev Inherits from multiple OpenZeppelin upgradeable extensions and includes custom signature validation
contract PhoenixNFTs is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    ERC721PausableUpgradeable,
    Ownable2StepUpgradeable,
    ERC721BurnableUpgradeable,
    VerifyByteSignature,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    SmartValidator,
    CreatorTokenValidator
{
    /// @notice Role identifier for operators allowed to mint and manage NFTs
    bytes32 public constant PANINI_NFT_OPERATOR =
        keccak256("PANINI_NFT_OPERATOR");
    /// @notice Tracks used nonces to prevent signature replay attacks
    mapping(uint256 => bool) public usedNonces;
    /// @notice Tracks token IDs that have been burned to prevent reuse
    mapping(uint256 => bool) public burnedTokenIds;
    /// @notice Toggle to control whether token burning is enabled
    bool public isBurnEnabled;
    /// @notice A lightweight struct used in view-only methods to return token ownership
    struct TokenOwner {
        uint256 tokenId;
        address owner;
    }
    /// @notice Emitted when tokens are minted or unlocked via signature-based request
    event NFTBatchMintedOrUnlocked(
        uint256 indexed requestNonce,
        address indexed owner,
        uint256[] tokenIds
    );

    // @notice Emitted when tokens are locked for bridging via signature-based request
    event NFTBatchLocked(
        uint256 indexed requestNonce,
        address indexed owner,
        uint256[] tokenIds
    );

    /// @notice Initializes the NFT contract with royalty and access control
    /// @param initialOwner Address to be assigned as the initial contract owner
    /// @param receiver Address to receive royalty fees
    /// @param feeNumerator Royalty fee (basis points format, e.g., 500 = 5%)
    function initialize(
        address initialOwner,
        address receiver,
        uint96 feeNumerator
    ) public initializer {
        __ERC721_init("SuperSonicNfts", "SuperSonicNfts");
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __ERC721Pausable_init();
        __Ownable_init(initialOwner);
        __Ownable2Step_init();
        __Ownable2Step_init_unchained();
        __ERC721Burnable_init();
        __ERC2981_init(receiver, feeNumerator);
        __CreatorTokenValidator_init();
        __SmartValidator_init();
        _grantRole(PANINI_NFT_OPERATOR, initialOwner);
    }

    /// @notice Pauses all token transfers
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpauses all token transfers
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @notice Mints a new NFT
    /// @param to The address that will own the minted token
    /// @param tokenId The ID of the token to be minted
    /// @param uri Metadata URI associated with the token
    /// @dev can only called by PANINI_NFT_OPERATOR
    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri
    ) public onlyRole(PANINI_NFT_OPERATOR) {
        require(
            !burnedTokenIds[tokenId],
            "Token ID was burned and cannot be reused"
        );
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // The following functions are overrides required by Solidity.
    /// @inheritdoc ERC721Upgradeable
    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721PausableUpgradeable
        )
        returns (address)
    {
        // beforeTokenTransfer hook
        _beforeTokenTransfer(auth, _ownerOf(tokenId), to, tokenId);

        // panini validateTransfer hook
        _validateTransfer(auth, _ownerOf(tokenId), to);

        return super._update(to, tokenId, auth);
    }

    /// @inheritdoc ERC721Upgradeable
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Returns the URI for a given token ID.
     * @param tokenId The ID of the token.
     * @return The URI string for the specified token.
     */
    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @inheritdoc ERC721Upgradeable
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721URIStorageUpgradeable,
            ERC2981Upgradeable,
            AccessControlUpgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Batch mints multiple NFTs to a single address
    /// @param to Recipient address
    /// @param tokenIds Array of token IDs to mint
    /// @param uris Array of metadata URIs for each token
    /// @dev can only called by the PANINI_NFT_OPERATOR
    function batchMint(
        address to,
        uint256[] memory tokenIds,
        string[] memory uris
    ) external onlyRole(PANINI_NFT_OPERATOR) {
        require(to != address(0), "Invalid recipient");
        require(
            tokenIds.length == uris.length,
            "Token IDs and URIs length mismatch"
        );
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(!_exists(tokenIds[i]), "Token ID already exists");
            require(
                !burnedTokenIds[tokenIds[i]],
                "Token ID was burned and cannot be reused"
            );
            _mint(to, tokenIds[i]);
            _setTokenURI(tokenIds[i], uris[i]);
        }
    }

    /**
     * @notice Validates the operator before setting approval.
     */
    /// @inheritdoc ERC721Upgradeable
    function setApprovalForAll(
        address operator,
        bool approved
    ) public override(ERC721Upgradeable, IERC721) {
        _validateApproval(operator);
        super.setApprovalForAll(operator, approved);
    }

    /**
     * @notice Validates the operator before setting approval.
     * add extra check for operator
     */
    /// @inheritdoc ERC721Upgradeable
    function approve(
        address operator,
        uint256 tokenId
    ) public override(ERC721Upgradeable, IERC721) {
        _validateApproval(operator);
        super.approve(operator, tokenId);
    }

    /**
     * @notice See {IERC721-isApprovedForAll}.
     * add extra check for operator
     */
    /// @inheritdoc ERC721Upgradeable
    function isApprovedForAll(
        address owner,
        address operator
    ) public view override(ERC721Upgradeable, IERC721) returns (bool) {
        _validateApproval(operator);
        return super.isApprovedForAll(owner, operator);
    }

    /// @notice Burns the specified NFT
    /// @param tokenId Token ID to burn
    /// @dev Can only be called by the token owner and when burn is enabled
    function burn(uint256 tokenId) public virtual override {
        require(isBurnEnabled, "Burning NFT is not enabled");
        require(_ownerOf(tokenId) == _msgSender(), "Only token owner can burn");
        super._burn(tokenId);
        burnedTokenIds[tokenId] = true;
        _resetTokenRoyalty(tokenId);
    }

    /**
     * @dev Mints or unlocks a batch of NFTs based on a valid signature.
     * @param tokenIds The token IDs to mint/unlock.
     * @param tokenURIs The metadata URIs of the tokens.
     * @param requestNonce The unique nonce for this request.
     * @param expiredAt The unique nonce for this request.
     * @param signature The signature verifying the request.
     */
    function batchMintOrUnlock(
        uint256[] calldata tokenIds,
        string[] calldata tokenURIs,
        uint256 requestNonce,
        uint256 expiredAt,
        bytes calldata signature
    ) external {
        require(
            tokenIds.length == tokenURIs.length,
            "Input array lengths mismatch"
        );
        require(
            tokenIds.length <= 25,
            "Input array length can't be greater than 25"
        );
        require(expiredAt > block.timestamp, "Signature expired");
        require(!usedNonces[requestNonce], "Nonce already used");

        bytes memory message = abi.encode(
            block.chainid,
            _msgSender(),
            tokenIds,
            tokenURIs,
            requestNonce,
            expiredAt
        );
        require(_verifySignature(message, signature), "Invalid signature");
        usedNonces[requestNonce] = true;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                !burnedTokenIds[tokenIds[i]],
                "Token ID was burned and cannot be reused"
            );

            if (!_exists(tokenIds[i])) {
                _safeMint(_msgSender(), tokenIds[i]);
                _setTokenURI(tokenIds[i], tokenURIs[i]);
            } else {
                require(
                    _ownerOf(tokenIds[i]) == address(this),
                    "Contract does not own token"
                );
                _safeTransfer(address(this), _msgSender(), tokenIds[i]);
            }
        }

        emit NFTBatchMintedOrUnlocked(requestNonce, _msgSender(), tokenIds);
    }

    /**
     * @dev Locks a batch of NFTs to bridge them to another network.
     * @param tokenIds The token IDs to lock.
     * @param requestNonce The unique nonce for this request.
     * @param expiredAt The unique nonce for this request.
     * @param signature The signature verifying the request.
     */
    function batchLockNFT(
        uint256[] calldata tokenIds,
        uint256 requestNonce,
        uint256 expiredAt,
        bytes calldata signature
    ) external {
        require(
            tokenIds.length <= 25,
            "Input array length can't be greater than 25"
        );
        require(expiredAt > block.timestamp, "Signature expired");
        require(!usedNonces[requestNonce], "Nonce already used");

        bytes memory message = abi.encode(
            block.chainid,
            _msgSender(),
            tokenIds,
            requestNonce,
            expiredAt
        );
        require(_verifySignature(message, signature), "Invalid signature");
        usedNonces[requestNonce] = true;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _bridgeLockTransfer(_msgSender(), address(this), tokenIds[i]);
        }
        emit NFTBatchLocked(requestNonce, _msgSender(), tokenIds);
    }

    /**
     * @dev Verifies a signature.
     * @param message The encoded message.
     * @param signature The signature to verify.
     * @return True if valid, otherwise false.
     */
    function _verifySignature(
        bytes memory message,
        bytes memory signature
    ) internal view returns (bool) {
        address signer = VerifyByteSignature.recoverSigner(message, signature);
        return hasRole(PANINI_NFT_OPERATOR, signer);
    }

    function isNonceUsed(uint256 _requestNonce) public view returns (bool) {
        return usedNonces[_requestNonce];
    }

    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     * Emits {MetadataUpdate}.
     * this function will be used in extreme sceanarios
     */
    function updateTokenURI(
        uint256 tokenId,
        string memory _tokenURI
    ) public virtual onlyRole(PANINI_NFT_OPERATOR) {
        _setTokenURI(tokenId, _tokenURI);
        emit MetadataUpdate(tokenId);
    }

    /// @notice enable or disable isBurnEnabled
    function updateBurn(bool _status) public onlyRole(PANINI_NFT_OPERATOR) {
        isBurnEnabled = _status;
    }

    // @notice Returns the owners of multiple token IDs.
    // @param tokenIds An array of token IDs to query.
    // @return result An array of TokenOwner structs containing token IDs and their owners.
    function ownersOf(
        uint256[] calldata tokenIds
    ) external view returns (TokenOwner[] memory) {
        require(
            tokenIds.length <= 25,
            "Input array length can't be greater than 25"
        );
        TokenOwner[] memory result = new TokenOwner[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            result[i] = TokenOwner(tokenIds[i], ownerOf(tokenIds[i]));
        }
        return result;
    }
}
