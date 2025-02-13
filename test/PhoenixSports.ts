import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("PhoenixSports", function () {
  async function deployPhoenixSportsFixture() {
    const [owner, minter, pauser, otherAccount] = await ethers.getSigners();

    const PhoenixSports = await ethers.getContractFactory("PhoenixSports");
    const phoenixSports = await PhoenixSports.deploy(owner.address, "PhoenixSports", "PSNFT");

    return { phoenixSports, owner, minter, pauser, otherAccount };
  }

  describe("Deployment", function () {
    it("Should assign the default admin role to the deployer", async function () {
      const { phoenixSports, owner } = await loadFixture(deployPhoenixSportsFixture);

      const DEFAULT_ADMIN_ROLE = await phoenixSports.DEFAULT_ADMIN_ROLE();
      expect(await phoenixSports.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should assign the minter and pauser roles to the deployer", async function () {
      const { phoenixSports, owner } = await loadFixture(deployPhoenixSportsFixture);

      const MINTER_ROLE = await phoenixSports.MINTER_ROLE();
      const PAUSER_ROLE = await phoenixSports.PAUSER_ROLE();

      expect(await phoenixSports.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await phoenixSports.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting NFTs", function () {
    it("Should allow MINTER_ROLE to mint an NFT", async function () {
      const { phoenixSports, owner } = await loadFixture(deployPhoenixSportsFixture);

      const tokenId = 1;
      const tokenURI = "ipfs://example-uri";

      await phoenixSports.safeMint(owner.address, tokenId, tokenURI);
      expect(await phoenixSports.ownerOf(tokenId)).to.equal(owner.address);
      expect(await phoenixSports.tokenURI(tokenId)).to.equal(tokenURI);
    });

    it("Should not allow non-minters to mint", async function () {
      const { phoenixSports, otherAccount } = await loadFixture(deployPhoenixSportsFixture);

      const tokenId = 1;
      const tokenURI = "ipfs://example-uri";

      await expect(
        phoenixSports.connect(otherAccount).safeMint(otherAccount.address, tokenId, tokenURI)
      ).to.be.reverted;
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow PAUSER_ROLE to pause and unpause the contract", async function () {
      const { phoenixSports, owner } = await loadFixture(deployPhoenixSportsFixture);

      await phoenixSports.pause();
      expect(await phoenixSports.paused()).to.be.true;

      await phoenixSports.unpause();
      expect(await phoenixSports.paused()).to.be.false;
    });

    it("Should prevent minting while paused", async function () {
      const { phoenixSports, owner } = await loadFixture(deployPhoenixSportsFixture);

      const tokenId = 1;
      const tokenURI = "ipfs://example-uri";

      await phoenixSports.pause();

      await expect(
        phoenixSports.safeMint(owner.address, tokenId, tokenURI)
      ).to.be.reverted;
    });
  });

  describe("Burning NFTs", function () {
    it("Should allow NFT owners to burn their tokens", async function () {
      const { phoenixSports, owner } = await loadFixture(deployPhoenixSportsFixture);

      const tokenId = 1;
      const tokenURI = "ipfs://example-uri";

      await phoenixSports.safeMint(owner.address, tokenId, tokenURI);
      expect(await phoenixSports.ownerOf(tokenId)).to.equal(owner.address);

      await phoenixSports.burn(tokenId);
      await expect(phoenixSports.ownerOf(tokenId)).to.be.reverted;
    });
  });

  describe("Token URI", function () {
    it("Should return correct token URI after minting", async function () {
      const { phoenixSports, owner } = await loadFixture(deployPhoenixSportsFixture);

      const tokenId = 1;
      const tokenURI = "ipfs://example-uri";

      await phoenixSports.safeMint(owner.address, tokenId, tokenURI);
      expect(await phoenixSports.tokenURI(tokenId)).to.equal(tokenURI);
    });
  });
});
