const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("PaniniRoyaltyVault2", function () {
  let vault:any, owner:any, addr1:any, addr2:any, token:any, uniswapRouter:any, recipient:any, other:any;
  const initialETH = ethers.parseEther("10");
  const tokenAmount = ethers.parseEther("1000");

  beforeEach(async () => {
    [owner, addr1, addr2, recipient, other, uniswapRouter] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy("TestToken", "TT", owner.address, tokenAmount);
    await token.waitForDeployment();

    // const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
    // uniswapRouter = await MockRouter.deploy();
    // await uniswapRouter.waitForDeployment();

    const Vault = await ethers.getContractFactory("PaniniRoyaltyVault");
    vault = await upgrades.deployProxy(Vault, [owner.address,uniswapRouter.address, owner.address]);

    vault = await vault.waitForDeployment();
   

    
    await owner.sendTransaction({
      to: vault.target,
      value: initialETH,
    });

    await token.transfer(vault.target, tokenAmount);
  });

  it("should allow vault manager to withdraw ETH", async () => {
    await vault.updateReceiverWhitelistStatus(recipient.address, true);

    const amount = ethers.parseEther("0.001");
    const balanceBefore = await ethers.provider.getBalance(recipient.address);
    await vault.connect(owner).withdrawETH(amount, recipient.address);
    const balanceAfter = await ethers.provider.getBalance(recipient.address);

    expect(balanceAfter - balanceBefore).to.equal(amount);
  });

  it("should not allow non-vault manager to withdraw ETH", async () => {
    await expect(
      vault.connect(addr2).withdrawETH(ethers.parseEther("1"), recipient.address)
    ).to.be.revertedWith("Not authorized to withdraw");
  });

  it("should allow vault manager to withdraw ERC20 token", async () => {
    await vault.updateReceiverWhitelistStatus(recipient.address, true);
    await vault.connect(owner).withdrawERC20(token.target, recipient.address, tokenAmount);

    expect(await token.balanceOf(recipient.address)).to.equal(tokenAmount);
  });

  it("should update vault manager whitelist", async () => {
    expect(await vault.vaultManagers(addr2.address)).to.equal(false);
    await vault.connect(owner).updateVaultManager(addr2.address, true);
    expect(await vault.vaultManagers(addr2.address)).to.equal(true);
  });


  it("should approve token for swap", async () => {
    await vault.connect(owner).approveTokenForSwap(token.target, tokenAmount);
    const allowance = await token.allowance(vault.target, uniswapRouter.address);
    expect(allowance).to.equal(tokenAmount);
  });

  it("should pause and unpause the contract", async () => {
    await vault.pause();
    await expect(
      vault.connect(addr1).withdrawETH(ethers.parseEther("1"), recipient.address)
    ).to.be.reverted;

    await vault.unpause();
    await vault.updateReceiverWhitelistStatus(recipient.address, true);
    await vault.connect(owner).withdrawETH(ethers.parseEther("1"), recipient.address);
  });
});
