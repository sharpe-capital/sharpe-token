import "./lib/Owned.sol";

pragma solidity ^0.4.11;

contract ReserveWallet is Owned {

    // This will encapsulate the logic for moving founders tokens after the vesting period completes

    /// @notice This returns any Ether sent to the address
    function () {
        throw;
    }

    /// @notice Creates a new ReserveWallet contract
    function ReserveWallet() {
    }
}