// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC721Upgradeable,IERC721} from "./openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721BurnableUpgradeable} from "./openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "./openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {ERC721PausableUpgradeable} from "./openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import {ERC721URIStorageUpgradeable} from "./openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {Initializable} from "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "./openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC2981Upgradeable} from "./openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import {AccessControlUpgradeable} from "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PaniniValidator} from "./panini-smartlocks/PaniniValidator.sol";
import {CreatorTokenValidator} from "./limitbreak/CreatorTokenValidator.sol";
import {VerifyByteSignature} from "./openzeppelin/contracts/utils/VerifyByteSignature.sol";


contract PhoenixNFTs is Initializable, ERC721Upgradeable,
    ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable,
    ERC721PausableUpgradeable, OwnableUpgradeable, 
    ERC721BurnableUpgradeable,VerifyByteSignature,ERC2981Upgradeable,
    AccessControlUpgradeable,PaniniValidator,CreatorTokenValidator {

    bytes32 public constant PANINI_NFT_OPERATOR = keccak256("PANINI_NFT_OPERATOR");

    /// @notice Mapping to track used nonces to prevent replay attacks
    mapping(uint256 => bool) public usedNonces;

    /// @notice Event emitted when NFTs are minted or unlocked
    event NFTBatchMintedOrUnlocked(
        uint256 indexed requestNonce,
        address indexed owner,
        uint256[] tokenIds
    );

    /// @notice Event emitted when NFTs are locked for bridging
    event NFTBatchLocked(
        uint256 indexed requestNonce,
        address indexed owner,
        uint256[] tokenIds
    );


    // @custom:oz-upgrades-unsafe-allow constructor

    //test constructor
    // constructor(address initialOwner,address receiver, uint96 feeNumerator) {
    //     initialize(initialOwner,receiver,feeNumerator);
    // }

    function initialize(address initialOwner,address receiver, uint96 feeNumerator) public initializer {
        __ERC721_init("MeeToken2", "MTK2");
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __ERC721Pausable_init();
        __Ownable_init(initialOwner);
        __ERC721Burnable_init();
        __ERC2981_init(receiver,feeNumerator);
        __CreatorTokenValidator_init();
        __PaniniValidator_init();

        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(PANINI_NFT_OPERATOR, initialOwner);
        
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, uint256 tokenId, string memory uri)
        public
        onlyRole(PANINI_NFT_OPERATOR)
    {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // The following functions are overrides required by Solidity.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable)
        returns (address)
    {

        // beforeTokenTransfer hook
        _beforeTokenTransfer(auth,_ownerOf(tokenId), to, tokenId);

        // panini validateTransfer hook
        _validateTransfer(auth, _ownerOf(tokenId),to);


        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable, 
        ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Mints multiple NFTs in a batch.
     * @param to Address receiving the NFTs.
     * @param tokenIds Array of token IDs.
     * @param uris Array of metadata URIs.
    */
    function batchMint(address to, uint256[] memory tokenIds, string[] memory uris) external onlyRole(PANINI_NFT_OPERATOR) {
        require(to != address(0), "Invalid recipient");
        require(tokenIds.length == uris.length, "Token IDs and URIs length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(!_exists(tokenIds[i]), "Token ID already exists");
            _mint(to, tokenIds[i]);
            _setTokenURI(tokenIds[i], uris[i]);
        }
    }

    function setApprovalForAll(address operator, bool approved) public override(ERC721Upgradeable,IERC721) {
        _validateApproval(operator);
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId) public override(ERC721Upgradeable,IERC721) {
        _validateApproval(operator);
        super.approve(operator, tokenId);
    }
    
    /**
     * @notice See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator) public view override(ERC721Upgradeable,IERC721) returns (bool) {        
        _validateApproval(operator);
        return super.isApprovedForAll(owner, operator);
    }

    function burn(uint256 tokenId) public virtual override  {
        require(_ownerOf(tokenId)==_msgSender(), "Only token owner can burn");
        _burn(tokenId);
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

        require(expiredAt > block.timestamp, "Signature expired");
        require(!usedNonces[requestNonce], "Nonce already used");
        usedNonces[requestNonce] = true;

        bytes memory message = abi.encode(
            block.chainid,
            _msgSender(),
            tokenIds,
            tokenURIs,
            requestNonce,
            expiredAt
        );
        require(_verifySignature(message, signature), "Invalid signature");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (!_exists(tokenIds[i])) {
                _safeMint(_msgSender(), tokenIds[i]);
                _setTokenURI(tokenIds[i], tokenURIs[i]);
            } else {
                _safeTransfer(address(this),_msgSender(),tokenIds[i]);

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
        require(expiredAt > block.timestamp, "Signature expired");
        require(!usedNonces[requestNonce], "Nonce already used");
        usedNonces[requestNonce] = true;

        bytes memory message = abi.encode(
            block.chainid,
            _msgSender(),
            tokenIds,
            requestNonce,
            expiredAt
        );
        require(_verifySignature(message, signature), "Invalid signature");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            safeTransferFrom(_msgSender(), address(this), tokenIds[i]);
        }
        

        emit NFTBatchLocked(requestNonce, _msgSender(), tokenIds);
    }

    /**
     * @dev Verifies a signature.
     * @param message The encoded message.
     * @param signature The signature to verify.
     * @return True if valid, otherwise false.
     */
    function _verifySignature(bytes memory message, bytes memory signature)
        internal
        view
        returns (bool)
    {
        address signer = VerifyByteSignature.recoverSigner(message, signature);
        return hasRole(PANINI_NFT_OPERATOR , signer);
    }

    function isNonceUsed(uint256 _requestNonce)
        public
        view
        returns (bool)
    {
        return usedNonces[_requestNonce];
    }

    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     * Emits {MetadataUpdate}.
     * this function will be used in extreme sceanarios
     */
    function updateTokenURI(uint256 tokenId, string memory _tokenURI)  public virtual onlyRole(PANINI_NFT_OPERATOR) {
        _setTokenURI(tokenId, _tokenURI);
        emit MetadataUpdate(tokenId);
    }


}
