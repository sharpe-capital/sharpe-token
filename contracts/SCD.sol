import "./lib/StandardToken.sol";
import "./lib/Owned.sol";

pragma solidity ^0.4.11;

contract SCD is StandardToken, Owned {

    /// @notice This returns any Ether sent to the address
    function () {
        throw;
    }

    string public symbol;
    string public name = "Sharpe Derivative Token";
    uint8 public decimals = 18;
    string public version = 'v1.0';
    uint256 public currentSupply = 0;
    uint256 public totalSupply = 300000 ether;

    mapping (address => uint256) minted;

    /// @notice Creates a new SCD contract with the specified total supply
    function SCD(string _symbol) {
        symbol = _symbol;
    }

    function mintedAt(address target) public returns (uint256) {
        return minted[target];
    }

    /// @notice This creates new SCD tokens and sends them to the specified recipient
    /// @param amount The amount of SCD tokens to create
    /// @param recipient The recipients address
    /// @return True if the minting is successful
    function mintTokens(uint256 amount, address recipient) onlyOwner returns (bool) {

        uint256 newSupply = currentSupply + amount;

        if(newSupply > totalSupply) {
            return false;
        } else {
            balances[recipient] += amount;
            currentSupply += amount;
            minted[recipient] += amount;
            Transfer(0, recipient, amount);
            return true;
        }
    }
}