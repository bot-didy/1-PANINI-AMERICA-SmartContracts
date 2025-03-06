// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// import "hardhat/console.sol";

contract VerifyByteSignature {
    function getMessageHash(bytes memory _message) public pure returns (bytes32) {
        return keccak256(_message);
    }

    function getEthSignedMessageHash(bytes32 _messageHash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function verifySigner(
        address _signer,
        bytes memory _message,
        bytes memory _signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        // (address to, string memory sku) = abi.decode(bytes(_message), (address,string));
        // console.log(to,sku);

        return recoverSigner(ethSignedMessageHash, _signature) == _signer;
    }

    function verifySignature(
        address _signer,
        bytes memory _message,
        bytes memory _signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHash(_message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        // (address to, string memory sku) = abi.decode(bytes(_message), (address,string));
        // console.log(to,sku);

        return recoverSigner(ethSignedMessageHash, _signature) == _signer;
    }


    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature)
        public
        pure
        returns (address)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        public
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            // First 32 bytes stores the length of the signature
            // Add 32 to skip the length field of the signature
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        return (r, s, v);
    }
}
