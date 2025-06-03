// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "../openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "../openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

//SmartValidator
contract SmartValidator is Initializable, AccessControlUpgradeable {
    bytes32 public constant WHITELISTED_MARKETPLACE = keccak256("WHITELISTED_MARKETPLACE");
    bool public paniniLock;

    error InvalidOperator(string errorText);

    // @notice Initializes the contract instead of constructor

    function __SmartValidator_init() internal onlyInitializing {
        paniniLock = true;
    }

    /// @notice Validates if a transfer is allowed under the Panini Lock
    function _validateTransfer(
        address caller,
        address from,
        address to
    ) internal view {
        if (paniniLock) {
            bool fromZeroAddress = from == address(0);
            bool toZeroAddress = to == address(0);

            if (!fromZeroAddress && !toZeroAddress && from != address(this)) {
                if (
                    !hasRole(WHITELISTED_MARKETPLACE, caller) && caller != from
                ) {
                    revert InvalidOperator(
                        "Caller Is Not Owner Or Whitelisted Marketplace  "
                    );
                }
            }
        }
    }

    /// @notice Validates if a transfer is allowed under the Panini Lock
    function _validateTransfer(address caller, address from) internal view {
        if (paniniLock) {
            if (!hasRole(WHITELISTED_MARKETPLACE, caller) && caller != from) {
                revert InvalidOperator(
                    "Caller Is Not Owner Whitelisted Marketplace "
                );
            }
        }
    }

    /// @notice Validates if an approval action is allowed
    function _validateApproval(address _operator) internal view {
        if (paniniLock) {
            if (!hasRole(WHITELISTED_MARKETPLACE, _operator)) {
                revert InvalidOperator(
                    "Operator/Marketplace is not whitelisted"
                );
            }
        }
    }

    /// @notice Enable or disable Panini Lock
    function setPaniniLock(bool _status) public  {
        paniniLock = _status;
    }
}
