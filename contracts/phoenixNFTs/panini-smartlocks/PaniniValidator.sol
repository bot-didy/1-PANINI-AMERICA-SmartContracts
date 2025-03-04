// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../openzeppelin/contracts/access/AccessControl.sol";

contract PaniniValidator is AccessControl {
    bytes32 public constant WHITELISTED_MARKETPLACE = keccak256("WHITELISTED_MARKETPLACE");
    bool public paniniLock = true;

    error InvalidOperator(string errorText);

    constructor() {
    }

    /// @notice Validates if a transfer is allowed under the Panini Lock
    function _validateTransfer(address _operator, address _owner) internal view  {
        if (paniniLock) {
            if (!hasRole(WHITELISTED_MARKETPLACE, _operator) && _operator != _owner) {
                revert InvalidOperator("Not owner or Marketplace is not whitelisted");
            }
        }
    }

    /// @notice Validates if an approval action is allowed
    function _validateApproval(address _operator) internal view {
        if (paniniLock) {
            if (!hasRole(WHITELISTED_MARKETPLACE, _operator)) {
                revert InvalidOperator("Operator/Marketplace is not whitelisted");
            }
        }
    }

    /// @notice Enable or disable Panini Lock
    function setPaniniLock(bool _status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paniniLock = _status;
    }
}
