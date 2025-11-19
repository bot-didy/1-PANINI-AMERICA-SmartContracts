const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("PaniniRoyaltyVault", function () {
  let vault:any, owner:any, addr1:any, addr2:any, token:any, uniswapRouter:any, recipient:any, other:any;
  const initialETH = ethers.parseEther("100");
  const tokenAmount = ethers.parseEther("1000");

  beforeEach(async () => {
    [owner, addr1, addr2, recipient, other] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy("TestToken", "TT", owner.address, tokenAmount);
    await token.waitForDeployment();

    const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
    uniswapRouter = await MockRouter.deploy();
    await uniswapRouter.waitForDeployment();

    const Vault = await ethers.getContractFactory("PaniniRoyaltyVault");
    vault = await upgrades.deployProxy(Vault, [owner.address, owner.address, recipient.address,uniswapRouter.target]);

    vault = await vault.waitForDeployment();
   
    
    await owner.sendTransaction({
      to: vault.target,
      value: initialETH,
    });

    await token.transfer(vault.target, tokenAmount);
  });

  it("should allow vault manager to withdraw ETH", async () => {

    const amount = ethers.parseEther("0.001");
    const balanceBefore = await ethers.provider.getBalance(recipient.address);
    await vault.connect(owner).grantRole(await vault.VAULT_MANAGER(), owner);
    await vault.connect(owner).withdrawETH(amount, recipient.address);
    const balanceAfter = await ethers.provider.getBalance(recipient.address);

    expect(balanceAfter - balanceBefore).to.equal(amount);
  });

  it("should not allow non-vault manager to withdraw ETH", async () => {
    await expect(
      vault.connect(addr2).withdrawETH(ethers.parseEther("1"), recipient.address)
    ).to.be.revertedWithCustomError(vault, "AccessControlUnauthorizedAccount").withArgs(
      addr2.address, await vault.VAULT_MANAGER() 
    )
  });

  it("should allow vault manager to withdraw ERC20 token", async () => {
    await vault.connect(owner).grantRole(await vault.VAULT_MANAGER(), owner);
    await vault.connect(owner).withdrawERC20(token.target, recipient.address, tokenAmount);
    expect(await token.balanceOf(recipient.address)).to.equal(tokenAmount);
  });

  it("grant vault manager role", async () => {
    await vault.connect(owner).grantRole(await vault.VAULT_MANAGER(), addr2);
    expect(await vault.hasRole(await vault.VAULT_MANAGER(), addr2.address)).to.equal(true);
  });

  it("admin only can grant vault manager role", async () => {
    await expect(vault.connect(addr2).grantRole(await vault.VAULT_MANAGER(), addr2)
    ).to.be.revertedWithCustomError(vault, "AccessControlUnauthorizedAccount"
    ).withArgs(addr2.address, await vault.DEFAULT_ADMIN_ROLE());
  });


  it("should approve token for swap", async () => {
    await vault.connect(owner).grantRole(await vault.VAULT_MANAGER(), owner);
    await vault.connect(owner).setTokenAllowance(token.target, tokenAmount);
    const allowance = await token.allowance(vault.target, uniswapRouter.target);
    expect(allowance).to.equal(tokenAmount);
  });

  it("should pause and unpause the contract", async () => {
    await vault.connect(owner).pause();
    await vault.connect(owner).grantRole(await vault.VAULT_MANAGER(), addr1);
    await expect(
      vault.connect(addr1).withdrawETH(ethers.parseEther("1"), recipient.address)
    ).to.be.reverted;

    await vault.connect(owner).unpause();
    await vault.connect(addr1).withdrawETH(ethers.parseEther("1"), recipient.address);
  });

  it("update uniswap router address", async () => {    

    await vault.connect(owner).updateUniswapRouter(uniswapRouter.target)
    await expect(
    vault.connect(owner).updateUniswapRouter(other.address)
    ).to.be.reverted;
    await expect(
    vault.connect(owner).updateUniswapRouter(ethers.ZeroAddress)
    ).to.be.reverted;

  });

});
