// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    address public owner;

    constructor(
        string memory name_,
        string memory symbol_,
        address mintTo,
        uint256 amount
    ) ERC20(name_, symbol_) {
        owner = msg.sender;
        _mint(mintTo, amount);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Mint tokens to a specified address
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn tokens from a specified address
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
