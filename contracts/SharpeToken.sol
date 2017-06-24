import "./lib/StandardToken.sol";
import "./lib/Owned.sol";

pragma solidity ^0.4.11;

contract SharpeToken is StandardToken {

    /// @notice This returns any Ether sent to the address
    function () {
        throw;
    }

    string public symbol;
    string public name = "Sharpe Token";
    uint8 public decimals = 18;
    string public version = 'v1.0';
    uint256 public currentSupply = 0;
    uint256 public totalSupply = 300000 ether;

    /// @notice Creates a new SharpeToken contract with the specified total supply
    function SharpeToken(string _symbol) {
        symbol = _symbol;
    }

    /// @notice This creates new SHP tokens and sends them to the specified recipient
    /// @param amount The amount of SHP tokens to create
    /// @param recipient The recipients address
    /// @return True if the minting is successful
    function mintTokens(uint256 amount, address recipient) returns (bool) {

        uint256 newSupply = currentSupply + amount;

        if(newSupply > totalSupply) {
            return false;
        } else {
            balances[recipient] += amount;
            currentSupply += amount;
            return true;
        }
    }
}