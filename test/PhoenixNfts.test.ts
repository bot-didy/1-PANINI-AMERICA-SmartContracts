import { getBytes } from 'ethers';
import { AbiCoder } from 'ethers';
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
import { ethers as externalEthers } from 'ethers';

import { PhoenixNFTs } from "../typechain-types";


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

describe("PhoenixNFTs", function () {
  let phoenixNFTs;
  let owner:any, operator:any, user1:any, user2:any ;
  let nftContract:any;
  const feeNumerator = 500; // 5%
  const name = "SuperSonicNfts";
  const symbol = "SuperSonicNfts";

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
      expect(await nftContract.symbol()).to.equal(symbol);
      expect(await nftContract.owner()).to.equal(owner.address);
    });
  });

  describe("Minting NFT by Operator", function () {
    it("should mint a token", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(user1.address, 1, "ipfs://token1");
      expect(await nftContract.ownerOf(1)).to.equal(user1.address);
    });

    it("should not mint a token", async () => {
      expect(nftContract.connect(operator).safeMint(user1.address, 1, "ipfs://token1")).to.be.revertedWith("Minting NFT is not enabled");
    });

    it("should batch mint tokens", async () => {
      const tokenIds = [2, 3];
      const uris = ["ipfs://token2", "ipfs://token3"];
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).batchMint(user1.address, tokenIds, uris);

      for (let i = 0; i < tokenIds.length; i++) {
        expect(await nftContract.ownerOf(tokenIds[i])).to.equal(user1.address);
      }
    });
    it("should fail if caller is not owner", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await expect(
        nftContract.connect(user1).batchMint(user1.address, [2], ["uri://2"])
      ).to.be.revertedWithCustomError(nftContract, "AccessControlUnauthorizedAccount").withArgs(user1.address, await nftContract.PANINI_NFT_OPERATOR());
    });

    it("should fail if tokenIds and uris lengths mismatch", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await expect(
        nftContract.batchMint(user1.address, [2, 3], ["uri://2"])
      ).to.be.revertedWith("Invalid input: length mismatch or too many tokens (max 25)");
    });

    it("should fail if tokenId already exists", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.safeMint(user1.address, 1, "uri://1");
      await expect(
        nftContract.batchMint(user1.address, [1], ["uri://duplicate"])
      ).to.be.revertedWith("Token ID already exists");
    });

    it("should fail if tokenId is burned", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.safeMint(user1.address, 1, "uri://burned");
      await nftContract.updateBurnStatus(true);
      await nftContract.connect(user1).burn(1);
      await expect(
        nftContract.batchMint(user1.address, [1], ["uri://burned-again"])
      ).to.be.revertedWith("Token ID was burned and cannot be reused");
    });

    it("should fail if recipient is zero address", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await expect(
        nftContract.batchMint(externalEthers.ZeroAddress, [100], ["uri://100"])
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Pausing", () => {
    it("should pause and unpause", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.pause();
      await expect(nftContract.connect(operator).safeMint(user1.address, 4, "ipfs://paused")).to.be.reverted; //need to check lock
      await nftContract.unpause();
      await nftContract.connect(operator).safeMint(user1.address, 4, "ipfs://paused");
    });

    it("should allow only owner to pause/unpause", async () => {
      await expect(nftContract.connect(user1).pause()).to.be.reverted;
      await nftContract.pause();
      expect(await nftContract.paused()).to.be.true;
      await nftContract.unpause();
      expect(await nftContract.paused()).to.be.false;
    });

    it("should prevent mint when paused", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.pause();
      await expect(
        nftContract.safeMint(user1.address, 1, "uri://test")     
      ).to.be.revertedWithCustomError(nftContract, "EnforcedPause");
    });

    it("should prevent transfer when paused", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.safeMint(user1.address, 1, "uri://test");
      await nftContract.pause();
      await expect(
        nftContract.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWithCustomError(nftContract, "EnforcedPause");
    });

    it("should prevent burn when paused", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.safeMint(user1.address, 1, "uri://test");
      await nftContract.pause();
      await nftContract.updateBurnStatus(true)
      await expect(
        nftContract.connect(user1).burn(1)
      ).to.be.revertedWithCustomError(nftContract, "EnforcedPause");
    });
  });

  describe("Burn", () => {

    it("should throw error as burn permissions not given", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(user1.address, 5, "ipfs://burn");
      await expect(nftContract.connect(user1).burn(5)).to.be.reverted;
    });
    
    it("should allow owner to burn", async () => {
      const PANINI_NFT_OPERATOR = ethers.keccak256(
        ethers.toUtf8Bytes("PANINI_NFT_OPERATOR")
      );
      await nftContract.grantRole(PANINI_NFT_OPERATOR, operator.address);
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(user1.address, 5, "ipfs://burn");
      await nftContract.connect(operator).updateBurnStatus(true);
      await nftContract.connect(user1).burn(5);
      await expect(nftContract.ownerOf(5)).to.be.reverted;
    });

    it("should not allow non-owner to burn", async () => {
      const PANINI_NFT_OPERATOR = ethers.keccak256(
        ethers.toUtf8Bytes("PANINI_NFT_OPERATOR")
      );
      await nftContract.grantRole(PANINI_NFT_OPERATOR, operator.address);
      await nftContract.connect(operator).updateBurnStatus(true);
      await nftContract.connect(operator).updateMintStatus(true);
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
      ).to.be.revertedWithCustomError(nftContract, "OwnableUnauthorizedAccount")
      .withArgs(user1.address);
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

    it("shouldn't allow invalid operator approval", async () => {
      expect( nftContract.connect(owner).setApprovalForAll(user1.address, true)
      ).to.be.revertedWithCustomError(nftContract, 'InvalidOperator')
      .withArgs("Operator/Marketplace is not whitelisted")   
    });
  });

  describe("Token URI", () => {
    it("should update token URI by operator", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(user1.address, 7, "ipfs://olduri");
      await nftContract.updateTokenURI(7, "ipfs://newuri");
      expect(await nftContract.tokenURI(7)).to.equal("ipfs://newuri");
    });
    it("shouldn't update token URI by token owner", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(user1.address, 7, "ipfs://olduri");
      expect(nftContract.connect(user1).updateTokenURI(7, "ipfs://newuri")
      ).to.be.revertedWithCustomError(nftContract,"AccessControlUnauthorizedAccount")
      .withArgs(user1.address, await nftContract.PANINI_NFT_OPERATOR());
    });
    it("shouldn't update token URI other than operator", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(user1.address, 7, "ipfs://olduri");
      expect(nftContract.connect(user2).updateTokenURI(7, "ipfs://newuri")
      ).to.be.revertedWithCustomError(nftContract,"AccessControlUnauthorizedAccount")
      .withArgs(user1.address, await nftContract.PANINI_NFT_OPERATOR());
    });
  });

  describe("Signature-Based Mint/Unlock", () => {
    

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
      const signature = await signMessageMintOrUnlock(operator, msg);
      await nftContract.connect(operator).updateMintStatus(true);

      await nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature);
      expect(await nftContract.ownerOf(10)).to.equal(user1.address);
    });

    it("should revert if tokenIds length and tokenURIs length mismatched", async () => {
      const tokenIds = [12,13];
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
      await nftContract.connect(operator).updateMintStatus(true);
      
      await expect(
        nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature)
      ).to.be.revertedWith("Input array lengths mismatch");
    });

    it("should revert if tokenIds length and tokenURIs length is greater than 25", async () => {
      const tokenIds:any = [];
      const tokenURIs:any = [];
      for(var i= 0; i< 26;i++){
        tokenIds.push(i+1);
        tokenURIs.push("https://example.co.in")
      }
      
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

      await nftContract.connect(operator).updateMintStatus(true);
      await expect(
        nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature)
      ).to.be.revertedWith("Input array length can't be greater than 25");
    });

    it("should revert if signature is expired ", async () => {
      const tokenIds = [ 1,2];
      const tokenURIs = ["https://example.co.in", "https://example.co.in"];
      
      
      const nonce = 5678;
      const expiredAt = Math.floor(Date.now() / 1000) - 100;
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

      await nftContract.connect(operator).updateMintStatus(true);
      await expect(
        nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature)
      ).to.be.revertedWith("Signature expired");
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
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature);
      await expect(
        nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, nonce, expiredAt, signature)
      ).to.be.revertedWith("Nonce already used");
    });

    it("should batch mint and then lock with valid signature", async () => {
      const tokenIds = [20];
      const tokenURIs = ["ipfs://sig-lock"];
      const mintNonce = 9100;
      const lockNonce = 9200;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;

      // Mint first
      const mintMessage = [
        chainId,
        user1.address,
        tokenIds,
        tokenURIs,
        mintNonce,
        expiredAt,
      ];
      await nftContract.connect(operator).updateMintStatus(true);
      const mintSignature = await signMessageMintOrUnlock(operator, mintMessage);
      await nftContract.connect(user1).batchMintOrUnlock(tokenIds, tokenURIs, mintNonce, expiredAt, mintSignature);
      expect(await nftContract.ownerOf(20)).to.equal(user1.address);

      // Then lock
      const lockMessage = [
        chainId,
        user1.address,
        tokenIds,
        lockNonce,
        expiredAt,
      ];
      const lockSignature = await signMessage(operator, lockMessage);
      await nftContract.connect(user1).batchLockNFT(tokenIds, lockNonce, expiredAt, lockSignature);

      const lockStatus = await nftContract.ownerOf(20);
      expect(lockStatus).to.equal(nftContract.target);
    });
  });

  describe("BatchLock NFT", () => {
    
    it("should batch lock with valid signature", async () => {
      const tokenIds = [10];
      const nonce = 1234;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      await nftContract.connect(operator).updateMintStatus(true);
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

    it("should batch lock with invalid signature", async () => {
      const tokenIds = [10];
      const nonce = 1234;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(operator.address, 10, "https:://ifps,io")

      const msg = [
        chainId,
        operator.address,
        tokenIds,
        nonce,
        expiredAt,
      ];
      const signature = await signMessage(user1, msg);
      expect(nftContract.connect(operator).batchLockNFT(tokenIds, nonce, expiredAt, signature)
      ).to.be.revertedWith("Invalid signature");
     ;
    });

    it("should revert if tokenIds length and tokenURIs length mismatched", async () => {
      const tokenIds = [10, 12];
      const nonce = 1234;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(operator.address, 10, "https:://ifps,io")

      const msg = [
        chainId,
        operator.address,
        tokenIds,
        nonce,
        expiredAt,
      ];
      const signature = await signMessage(operator, msg);
      expect(nftContract.connect(operator).batchLockNFT(tokenIds, nonce, expiredAt, signature)
      ).to.be.revertedWith("Input array lengths mismatch");
     ;
    });

    it("should revert if tokenIds length and tokenURIs length is greater than 25", async () => {
      const tokenIds:any = [];
      const tokenURIs:any = [];
      for(var i= 0; i< 25;i++){
        tokenIds.push(i+1);
        tokenURIs.push("example.in")
      }
      const nonce = 1234;
      const expiredAt = Math.floor(Date.now() / 1000) + 1000;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(operator.address, 100, "https:://ifps,io")
      await nftContract.connect(operator).batchMint(operator.address, tokenIds, tokenURIs)
      const msg = [
        chainId,
        operator.address,
        [100, ...tokenIds],
        nonce,
        expiredAt,
      ];
      const signature = await signMessage(operator, msg);
      expect(nftContract.connect(operator).batchLockNFT([100, ...tokenIds], nonce, expiredAt, signature)
      ).to.be.revertedWith("Invalid input: length mismatch or too many tokens (max 25)");
     
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
      await nftContract.connect(operator).updateMintStatus(true);
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
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(operator.address, 7, "ipfs://olduri");
      await nftContract.connect(owner).grantRole(WHITELISTED_MARKETPLACE, user1.address);
      await nftContract.connect(operator).approve(user1.address, 7);
    });

    it("should revert token approval other than operator", async () => {
      const WHITELISTED_MARKETPLACE = ethers.keccak256(
        ethers.toUtf8Bytes("WHITELISTED_MARKETPLACE")
      );
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(operator.address, 7, "ipfs://olduri");
      await nftContract.connect(owner).grantRole(WHITELISTED_MARKETPLACE, user1.address);
      expect(nftContract.connect(user1).approve(user1.address, 7)
      ).to.be.revertedWithCustomError(nftContract, 'ERC721InvalidApprover')
      .withArgs(user1.address);
    });

    it("shouldn't approve token transfer by when it is not whitelisted marketplace", async () => {
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.connect(operator).safeMint(operator.address, 7, "ipfs://olduri");
      
      expect(nftContract.connect(operator).approve(user1.address, 7)
      ).to.be.revertedWithCustomError(nftContract, 'InvalidOperator')
      .withArgs("Operator/Marketplace is not whitelisted") ;
    });
  });

  describe('SafeTransferFrom', () => { //transferFrom, safeTransferFrom(2 methods)
    it("should transfer nft from source to destination", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      await nftContract.connect(operator).updateMintStatus(true);
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
    it("should transfer nft from source to destination with data", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      await nftContract.connect(operator).updateMintStatus(true);
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
    it("should revert if non approved address transfer nft from source to destination", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      await nftContract.connect(operator).updateMintStatus(true);
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");
      await nftContract.grantRole(WHITELISTED_MARKETPLACE, user2.address);

      // addr1 approves addr2 to transfer token
      await nftContract.connect(user1).approve(user2.address, tokenId);

      // addr2 does transferFrom
      expect(nftContract.connect(operator)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, tokenId)
      ).to.be.revertedWithCustomError(nftContract,'ERC721InvalidApprover');
      
    })
    it("should revert if approved address transfer some other nft rather than approved from source to destination", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      await nftContract.connect(operator).updateMintStatus(true);
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");
      await nftContract.grantRole(WHITELISTED_MARKETPLACE, user2.address);

      // addr1 approves addr2 to transfer token
      await nftContract.connect(user1).approve(user2.address, tokenId);
      // addr2 does transferFrom
      expect(nftContract.connect(user2)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, 2)
      ).to.be.revertedWithCustomError(nftContract, "ERC721NonexistentToken")
      .withArgs(2)
      
      
    })
  })

  describe('transferFrom', () => { 
    it("should transfer NFT using safeTransferFrom(address,address,uint256)", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      await nftContract.connect(operator).updateMintStatus(true);
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
    it("should not transfer NFT using safeTransferFrom(address,address,uint256) when token id not approved", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      const WHITELISTED_MARKETPLACE = await nftContract.WHITELISTED_MARKETPLACE();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      const notApprovedTokenId = 3
      await nftContract.connect(operator).updateMintStatus(true);
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");
      await nftContract.grantRole(WHITELISTED_MARKETPLACE, user2.address);

      // addr1 approves addr2 to transfer token
      await nftContract.connect(user1).approve(user2.address, tokenId);

      // addr2 does transferFrom
      expect( nftContract.connect(user2).transferFrom(user1.address, user2.address, notApprovedTokenId)
      ).to.be.revertedWithCustomError(nftContract, 'ERC721NonexistentToken').withArgs( notApprovedTokenId);

      
    })

    it("should fail if non-approved address tries to transfer", async () => {
      const tokenId = 2;
      await nftContract.connect(operator).updateMintStatus(true);
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");
      
      await expect(
        nftContract.connect(user2).transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWithCustomError(nftContract,'InvalidOperator').withArgs("Caller Is Not Owner Or Whitelisted Marketplace");
    });
  })

  describe('setPaniniLock', () => {
    it("should transfer NFT using safeTransferFrom(address,address,uint256, bytes)", async () =>{
      await nftContract.setPaniniLock(false);
      const tokenId = 1;
      await nftContract.connect(operator).updateMintStatus(true);
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

    it("should not transfer  NFT using safeTransferFrom(address,address,uint256, bytes) when panini lock is true", async () =>{
      
      const tokenId = 1;
      await nftContract.connect(operator).updateMintStatus(true);
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");

      // addr1 approves addr2 to transfer token
      expect( nftContract.connect(user1).approve(user2.address, tokenId)
      ).to.be.revertedWithCustomError(nftContract, "InvalidOperator")
      .withArgs("Operator/Marketplace is not whitelisted");

    })
  })

  describe("transferOwnerShip", () =>{
    it("should transfer ownership to another address", async () => {
    
      expect(await nftContract.owner()).to.equal(owner.address);
    
      await nftContract.transferOwnership(user1.address);
    
      expect(await nftContract.owner()).to.equal(owner.address);
      
      await nftContract.connect(user1).acceptOwnership();

      expect(await nftContract.owner()).to.equal(user1.address);
    });

    it("should revert transferOwnership if called by non-owner", async () => {
      await expect(
        nftContract.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWithCustomError(nftContract,"OwnableUnauthorizedAccount").withArgs(user1.address);
    });

    it("should revert acceptOwnership if called by non-pending owner", async () => {
      await nftContract.transferOwnership(user1.address);
      await expect(
        nftContract.connect(user2).acceptOwnership()
      ).to.be.revertedWithCustomError(nftContract,"OwnableUnauthorizedAccount").withArgs(user2.address);
    });
  })

  describe('transferToContract', () => { 
    it("should transfer nft from source to destination", async () => {
      const PANINI_NFT_OPERATOR = await nftContract.PANINI_NFT_OPERATOR();
      await nftContract.grantRole(PANINI_NFT_OPERATOR, owner.address);
      const tokenId = 1;
      await nftContract.connect(operator).updateMintStatus(true);
      // Mint to addr1
      await nftContract.safeMint(user1.address, tokenId, "ipfs://somehash");

      // addr2 does transferFrom
      await expect(nftContract.connect(user1).transferFrom(user1.address, nftContract.target, tokenId)).to.be.revertedWithCustomError(nftContract, "ERC721InvalidReceiver").withArgs(nftContract.target);
      
    })
  })

});
