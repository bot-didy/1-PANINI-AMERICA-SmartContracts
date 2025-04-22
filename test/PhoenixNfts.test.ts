import { getBytes } from 'ethers';
import { AbiCoder } from 'ethers';
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
import { ethers as externalEthers } from 'ethers';

import { PhoenixNFTs } from "../typechain-types";

describe("PhoenixNFTs", function () {
  let phoenixNFTs;
  let owner:any, operator:any, user1:any, user2:any ;
  let nftContract:any;
  const feeNumerator = 500; // 5%
  const name = "PhoenixNfts";
  const symbol = "MTK2";

  beforeEach(async () => {
    [owner, operator, user1, user2] = await ethers.getSigners();

    const PhoenixNFTs = await ethers.getContractFactory("PhoenixNFTs");
    nftContract = await upgrades.deployProxy(PhoenixNFTs, [owner.address, owner.address, feeNumerator]);
    await nftContract.waitForDeployment();

    await nftContract.grantRole(await nftContract.PANINI_NFT_OPERATOR(), operator.address);
  });

  describe("Deployment", function () {
    it("should initialize with correct values", async () => {
      expect(await nftContract.name()).to.equal(name);
      // expect(await nftContract.symbol()).to.equal(symbol);
      expect(await nftContract.hasRole(await nftContract.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("should mint a token", async () => {
      await nftContract.connect(operator).safeMint(user1.address, 1, "ipfs://token1");
      expect(await nftContract.ownerOf(1)).to.equal(user1.address);
    });

    it("should batch mint tokens", async () => {
      const tokenIds = [2, 3];
      const uris = ["ipfs://token2", "ipfs://token3"];
      await nftContract.connect(operator).batchMint(user1.address, tokenIds, uris);

      for (let i = 0; i < tokenIds.length; i++) {
        expect(await nftContract.ownerOf(tokenIds[i])).to.equal(user1.address);
      }
    });
  });

  describe("Pausing", () => {
    it("should pause and unpause", async () => {
      await nftContract.pause();
      await expect(nftContract.connect(operator).safeMint(user1.address, 4, "ipfs://paused")).to.be.reverted; //need to check lock
      await nftContract.unpause();
      await nftContract.connect(operator).safeMint(user1.address, 4, "ipfs://paused");
    });
  });

  describe("Burn", () => {
    it("should allow owner to burn", async () => {
      await nftContract.connect(operator).safeMint(user1.address, 5, "ipfs://burn");
      await nftContract.connect(user1).burn(5);
      await expect(nftContract.ownerOf(5)).to.be.reverted;
    });

    it("should not allow non-owner to burn", async () => {
      await nftContract.connect(operator).safeMint(user1.address, 6, "ipfs://failburn");
      await expect(nftContract.connect(user2).burn(6)).to.be.revertedWith("Only token owner can burn");
    });
  });

  describe("PhoenixNFTs - Whitelisting (Role-based Access)", () => {
   
    const PANINI_NFT_OPERATOR = ethers.keccak256(
      ethers.toUtf8Bytes("PANINI_NFT_OPERATOR")
    );
  
    it("should allow the admin to whitelist an address (grant PANINI_NFT_OPERATOR role)", async () => {
      await nftContract.grantRole(PANINI_NFT_OPERATOR, user1.address);
  
      const hasRole = await nftContract.hasRole(PANINI_NFT_OPERATOR, user1.address);
      expect(hasRole).to.be.true;
    });
  
    it("should revert if non-admin tries to grant role", async () => {
      await expect(
         nftContract.connect(user1).grantRole(PANINI_NFT_OPERATOR, user2.address)
      ).to.be.revertedWithCustomError(nftContract, "AccessControlUnauthorizedAccount")
      .withArgs(user1.address, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
  });

  describe("Approvals", () => {
    it("should allow valid operator approval", async () => {
      const WHITELISTED_MARKETPLACE = ethers.keccak256(
        ethers.toUtf8Bytes("WHITELISTED_MARKETPLACE")
      );
      await  nftContract.connect(owner).grantRole(WHITELISTED_MARKETPLACE, user1.address)

      await nftContract.connect(owner).setApprovalForAll(user1.address, true)

      expect(await nftContract.isApprovedForAll(owner.address, user1.address)).to.be.true;
    });
  });

  describe("Token URI", () => {
    it("should update token URI by operator", async () => {
      await nftContract.connect(operator).safeMint(user1.address, 7, "ipfs://olduri");
      await nftContract.updateTokenURI(7, "ipfs://newuri");
      expect(await nftContract.tokenURI(7)).to.equal("ipfs://newuri");
    });
  });

  describe("Signature-Based Mint/Unlock", () => {
    const signMessage = async (wallet:any, message:any) => {
      const encoded = new externalEthers.AbiCoder().encode(
        ["uint256", "address", "uint256[]", "string[]", "uint256", "uint256"],
        message
      );
      const hash = ethers.keccak256(encoded);
      return await wallet.signMessage(ethers.getBytes(hash));
    };

    it("should batch mint with valid signature", async () => {
      const tokenIds = [10, 11];
      const tokenURIs = ["ipfs://sig1", "ipfs://sig2"];
      const nonce = 1234;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;


      const msg = [
        chainId,
        user1.address,
        tokenIds,
        tokenURIs,
        nonce,
        expiredAt,
      ];
      const signature = await signMessage(operator, msg);

      await nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature);
      expect(await nftContract.ownerOf(10)).to.equal(user1.address);
    });

    it("should not reuse a nonce", async () => {
      const tokenIds = [12];
      const tokenURIs = ["ipfs://sig3"];
      const nonce = 5678;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const msg = [
        chainId,
        user1.address,
        tokenIds,
        tokenURIs,
        nonce,
        expiredAt,
      ];
      const signature = await signMessage(operator, msg);

      await nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature);
      await expect(
        nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature)
      ).to.be.revertedWith("Nonce already used");
    });
  });

  describe("BatchLock NFT", () => {
    const signMessage = async (wallet:any, message:any) => {
      const encoded = new externalEthers.AbiCoder().encode(
        ["uint256", "address", "uint256[]", "uint256", "uint256"],
        message
      );
      const hash = ethers.keccak256(encoded);
      return await wallet.signMessage(ethers.getBytes(hash));
    };

    const signMessageMintOrUnlock = async (wallet:any, message:any) => {
      const encoded = new externalEthers.AbiCoder().encode(
        ["uint256", "address", "uint256[]", "string[]", "uint256", "uint256"],
        message
      );
      const hash = ethers.keccak256(encoded);
      return await wallet.signMessage(ethers.getBytes(hash));
    };

    
    it("should batch mint with valid signature", async () => {
      const tokenIds = [10];
      const nonce = 1234;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      await nftContract.connect(operator).safeMint(operator.address, 10, "https:://ifps,io")

      const msg = [
        chainId,
        operator.address,
        tokenIds,
        nonce,
        expiredAt,
      ];
      const signature = await signMessage(operator, msg);
      await nftContract.connect(operator).batchLockNFT(tokenIds, nonce, expiredAt, signature);
      expect(await nftContract.ownerOf(10)).to.equal(nftContract.target);
    });

    it("should not reuse a nonce", async () => {
      const tokenIds = [12];
      const tokenURIs = ["ipfs://sig3"];
      const nonce = 5678;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const msg = [
        chainId,
        user1.address,
        tokenIds,
        tokenURIs,
        nonce,
        expiredAt,
      ];
      const signature = await signMessageMintOrUnlock(operator, msg);

      await nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature);
      await expect(
        nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature)
      ).to.be.revertedWith("Nonce already used");
    });
  });

  describe("Approve NFT", () => {
    it("should approve token transfer by operator", async () => {
      const WHITELISTED_MARKETPLACE = ethers.keccak256(
        ethers.toUtf8Bytes("WHITELISTED_MARKETPLACE")
      );
      
      await nftContract.connect(operator).safeMint(operator.address, 7, "ipfs://olduri");
      await nftContract.connect(owner).grantRole(WHITELISTED_MARKETPLACE, user1.address);
      await nftContract.connect(operator).approve(user1.address, 7);
    });
  });

  describe('SafeTransferFrom', () => { //transferFrom, safeTransferFrom(2 methods)
    it("should transfer nft from source to destination", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");
      await nftContract.grantRole(WHITELISTED_MARKETPLACE, user2.address);

      // addr1 approves addr2 to transfer token
      await nftContract.connect(user1).approve(user2.address, tokenId);

      // addr2 does transferFrom
      await nftContract.connect(user2)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, tokenId);

      // Check ownership
      const newOwner = await nftContract.ownerOf(tokenId);
      expect(newOwner).to.equal(user2.address);
      
    })
    it("should transfer nft from source to destination", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");
      await nftContract.grantRole(WHITELISTED_MARKETPLACE, user2.address);

      // addr1 approves addr2 to transfer token
      await nftContract.connect(user1).approve(user2.address, tokenId);

      // addr2 does transferFrom
      await nftContract.connect(user2)["safeTransferFrom(address,address,uint256, bytes)"](user1.address, user2.address, tokenId,'0x');

      // Check ownership
      const newOwner = await nftContract.ownerOf(tokenId);
      expect(newOwner).to.equal(user2.address);
      
    })
  })

  describe('transferFrom', () => { 
    it("should transfer nft from source to destination", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");
      await nftContract.grantRole(WHITELISTED_MARKETPLACE, user2.address);

      // addr1 approves addr2 to transfer token
      await nftContract.connect(user1).approve(user2.address, tokenId);

      // addr2 does transferFrom
      await nftContract.connect(user2).transferFrom(user1.address, user2.address, tokenId);

      // Check ownership
      const newOwner = await nftContract.ownerOf(tokenId);
      expect(newOwner).to.equal(user2.address);
      
    })
  })
  describe('setPaniniLock', () => {
    it("should allow transferFrom any Address when lock is set to false", async () =>{
      await nftContract.setPaniniLock(false);
      const tokenId = 1;
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");

      // addr1 approves addr2 to transfer token
      await nftContract.connect(user1).approve(user2.address, tokenId);

      // addr2 does transferFrom
      await nftContract.connect(user2).transferFrom(user1.address, user2.address, tokenId);

      // Check ownership
      const newOwner = await nftContract.ownerOf(tokenId);
      expect(newOwner).to.equal(user2.address);
    })
    
  })
  describe("transferOwnerShip", () =>{
    it("should transfer ownership to another address", async () => {
    
      expect(await nftContract.owner()).to.equal(owner.address);
    
      await nftContract.transferOwnership(user1.address);
    
      expect(await nftContract.owner()).to.equal(user1.address);
    });
  })

});
