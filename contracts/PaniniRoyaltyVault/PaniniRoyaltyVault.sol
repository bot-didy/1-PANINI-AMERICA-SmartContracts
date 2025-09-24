// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {OwnableUpgradeable} from "./openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "./openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {PausableUpgradeable} from "./openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "./openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "./openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IUniswapV2Router02} from "./uniswap/IUniswapV2Router02.sol";
import {AccessControlUpgradeable} from "./openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "./openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title RoyaltyVault
 * @notice Handles ETH and ERC20 fund management, including withdrawals and swaps using Uniswap.
 * @dev Upgradeable contract with access control, pausing, and whitelist mechanisms.
 */
contract PaniniRoyaltyVault is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    /// @notice Addresses allowed to manage the vault (withdraw, approve, swap)
    bytes32 public constant VAULT_PAUSER = keccak256("VAULT_PAUSER");
    bytes32 public constant VAULT_MANAGER = keccak256("VAULT_MANAGER");
    bytes32 public constant WHITELISTED_RECEIVER =
        keccak256("WHITELISTED_RECEIVER");

    /// @notice Address of the Uniswap V2 router used for swaps
    IUniswapV2Router02 public uniswapRouter;

    /// @notice Emitted when ETH is withdrawn from the contract
    event Withdrawn(address indexed recipient, uint256 amount);

    /// @notice Emitted when ERC20 tokens are withdrawn from the contract
    event WithdrawnERC20(
        address indexed recipient,
        uint256 amount,
        address indexed token
    );

    /// @notice Emitted when ETH is swapped for an ERC20 token
    event EthSwappedForToken(
        address indexed recipient,
        uint256 ethAmountIn,
        uint256 tokenAmountOut,
        address indexed tokenOutAddress
    );

    /// @notice Emitted when an ERC20 token is swapped for another ERC20 token
    event TokenSwappedForToken(
        address indexed tokenInAddress,
        uint256 tokenAmountIn,
        address indexed tokenOutAddress,
        uint256 tokenAmountOut,
        address indexed recipient
    );

    /**
     * @notice Disables initializers to protect logic contract.
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with initial configurations.
     * @param _whitelistedAccount Vault managers.
     * @param _uniswapRouter Address of the Uniswap V2 router.
     * @param _owner Address that will become the owner.
     */
    function initialize(
        address _owner,
        address _pauser,
        address _whitelistedAccount,
        address _uniswapRouter
    ) public initializer {
        require(_uniswapRouter != address(0), "Invalid router address");
        require(_owner != address(0), "Invalid owner address");
        require(_whitelistedAccount != address(0), "Invalid whitelist address");

        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();

        uniswapRouter = IUniswapV2Router02(_uniswapRouter);

        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(VAULT_PAUSER, _owner);
        _grantRole(VAULT_PAUSER, _pauser);
        _grantRole(WHITELISTED_RECEIVER, _whitelistedAccount);
        _grantRole(WHITELISTED_RECEIVER, address(this));
    }

    /**
     * @notice Accepts ETH deposits into the vault.
     */
    receive() external payable {
        require(msg.value > 0, "Must send some ETH");
    }

    /**
     * @notice Pauses the contract (disables swap and withdraw functions).
     */
    function pause() external onlyRole(VAULT_PAUSER) {
        _pause();
    }

    /**
     * @notice Unpauses the contract (enables swap and withdraw functions).
     */
    function unpause() external onlyRole(VAULT_PAUSER) {
        _unpause();
    }

    /**
     * @notice Returns the contract's ETH balance.
     */
    function getEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Returns the contract's balance for a given ERC20 token.
     * @param token Address of the token.
     */
    function getTokenBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // -------- Withdrawals --------

    /**
     * @notice Withdraws ETH from the vault to a whitelisted receiver.
     * @param amount Amount of ETH to withdraw.
     * @param receiver Address to receive the ETH.
     */
    function withdrawETH(
        uint256 amount,
        address receiver
    ) external whenNotPaused onlyRole(VAULT_MANAGER) nonReentrant {
        require(amount <= getEthBalance(), "Insufficient ETH balance");
        require(
            receiver != address(0) && hasRole(WHITELISTED_RECEIVER, receiver),
            "Invalid receiver"
        );
        payable(receiver).transfer(amount);
        emit Withdrawn(receiver, amount);
    }

    /**
     * @notice Withdraws ERC20 tokens from the vault to a whitelisted receiver.
     * @param token Address of the ERC20 token.
     * @param receiver Address to receive the tokens.
     * @param amount Amount of tokens to withdraw.
     */
    function withdrawERC20(
        address token,
        address receiver,
        uint256 amount
    ) external whenNotPaused onlyRole(VAULT_MANAGER) nonReentrant {
        require(amount <= getTokenBalance(token), "Insufficient token balance");
        require(
            receiver != address(0) && hasRole(WHITELISTED_RECEIVER, receiver),
            "Invalid receiver"
        );
        IERC20(token).safeTransfer(receiver, amount);
        emit WithdrawnERC20(receiver, amount, token);
    }

    // -------- Approvals & Swaps --------

    /**
     * @notice Approves a token amount for swapping via a router.
     * @param token Address of the ERC20 token.
     * @param amount Amount to approve.
     */
    function setTokenAllowance(
        address token,
        uint256 amount
    ) external whenNotPaused onlyRole(VAULT_MANAGER) nonReentrant {
        if (amount > 0) {
            require(
                IERC20(token).balanceOf(address(this)) >= amount,
                "Insufficient Token Balance"
            );
        }
        IERC20(token).approve(address(uniswapRouter), amount);
    }

    /**
     * @notice Swaps ETH for a whitelisted ERC20 token and sends it to the recipient.
     * @param amountIn ETH amount to swap.
     * @param amountOutMin Minimum acceptable output token amount.
     * @param outToken Address of the token to receive.
     * @param recipient Address to receive the token.
     */
    function swapEthForToken(
        uint256 amountIn,
        address outToken,
        uint256 amountOutMin,
        address recipient
    ) external whenNotPaused onlyRole(VAULT_MANAGER) nonReentrant {
        require(amountIn > 0, "Must send ETH to swap");
        require(
            recipient != address(0) && hasRole(WHITELISTED_RECEIVER, recipient),
            "Invalid receiver"
        );
        require(amountOutMin > 0, "Invalid minimum output amount");

        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = outToken;

        uint256[] memory amounts = uniswapRouter.swapExactETHForTokens{
            value: amountIn
        }(amountOutMin, path, recipient, block.timestamp + 500);
        emit EthSwappedForToken(recipient, amountIn, amounts[1], outToken);
    }

    /**
     * @notice Swaps one ERC20 token for another using Uniswap.
     * @param amountIn Input token amount.
     * @param amountOutMin Minimum acceptable output token amount.
     * @param inToken Input token address.
     * @param outToken Output token address.
     * @param recipient Address to receive output tokens.
     */
    function swapTokenForToken(
        address inToken,
        uint256 amountIn,
        address outToken,
        uint256 amountOutMin,
        address recipient
    ) external whenNotPaused onlyRole(VAULT_MANAGER) nonReentrant {
        require(amountIn > 0, "Must send ETH to swap");
        require(
            recipient != address(0) && hasRole(WHITELISTED_RECEIVER, recipient),
            "Invalid recipient"
        );
        require(amountOutMin > 0, "Invalid minimum output amount");

        address[] memory path = new address[](2);
        path[0] = inToken;
        path[1] = outToken;

        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            recipient,
            block.timestamp + 500
        );
        emit TokenSwappedForToken(
            inToken,
            amountIn,
            outToken,
            amounts[1],
            recipient
        );
    }

    function updateUniswapRouter(
        address newRouter
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRouter != address(0), "Invalid router address");
        uniswapRouter = IUniswapV2Router02(newRouter);
    }
}
