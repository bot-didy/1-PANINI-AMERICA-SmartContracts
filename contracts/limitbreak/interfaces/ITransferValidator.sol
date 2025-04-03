// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ITransferValidator {
 
    function validateTransfer(address caller, address from, address to, uint256 tokenId) external view;
    function beforeAuthorizedTransfer(address operator, address token, uint256 tokenId) external;
}