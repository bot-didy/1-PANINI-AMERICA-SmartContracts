// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ITransferValidatorSetTokenType {
    function setTokenTypeOfCollection(
        address collection,
        uint16 tokenType
    ) external;
}
