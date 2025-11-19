// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
pragma abicoder v2;

contract MockUniswapRouter {

    function exactInputSingle() public pure returns(bool){
        return true;
    }
}

