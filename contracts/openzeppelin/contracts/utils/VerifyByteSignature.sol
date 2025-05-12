// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VerifyByteSignature {

    function _getMessageHash(bytes memory _message) internal pure returns (bytes32) {
        return keccak256(_message);
    }

    function _getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    // function verifySignature(
    //     address _signer,
    //     bytes memory _message,
    //     bytes memory _signature
    // ) public pure returns (bool) {
    //     return recoverSigner(_message, _signature) == _signer;
    // }


    function recoverSigner(bytes memory _message, bytes memory _signature)
        public
        pure
        returns (address)
    {
        bytes32 messageHash = _getMessageHash(_message);
        bytes32 ethSignedMessageHash = _getEthSignedMessageHash(messageHash);

        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
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
