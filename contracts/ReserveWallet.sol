import "./lib/Owned.sol";

pragma solidity ^0.4.11;

contract ReserveWallet is Owned {

    /// @notice This returns any Ether sent to the address
    function () {
        throw;
    }

    /// @notice Creates a new ReserveWallet contract
    function ReserveWallet() {
    }
}