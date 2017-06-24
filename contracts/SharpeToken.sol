/*
This Token Contract implements the standard token functionality (https://github.com/ethereum/EIPs/issues/20) as well as the following OPTIONAL extras intended for use by humans.

In other words. This is intended for deployment in something like a Token Factory or Mist wallet, and then used by humans.
Imagine coins, currencies, shares, voting weight, etc.
Machine-based, rapid creation of many tokens would not necessarily need these extra features or will be minted in other manners.

1) Initial Finite Supply (upon creation one specifies how much is minted).
2) In the absence of a token registry: Optional Decimal, Symbol & Name.
3) Optional approveAndCall() functionality to notify a contract if an approval() has occurred.

.*/

import "./StandardToken.sol";

pragma solidity ^0.4.11;

contract SharpeToken is StandardToken {

    function () {
        //if ether is sent to this address, send it back.
        throw;
    }

    /* Public variables of the token */

    /*
    NOTE:
    The following variables are OPTIONAL vanities. One does not have to include them.
    They allow one to customise the token contract & in no way influences the core functionality.
    Some wallets/interfaces might not even bother to look at this information.
    */
    string public name = "Sharpe Token";                //fancy name: eg Simon Bucks
    uint8 public decimals = 18;                         //How many decimals to show. ie. There could 1000 base units with 3 decimals. Meaning 0.980 SBX = 980 base units. It's like comparing 1 wei to 1 ether.
    string public symbol = "SHP";                       //An identifier: eg SBX
    string public version = 'v1.0';                     // v1.0 standard. Just an arbitrary versioning scheme.

    function SharpeToken(uint256 _totalSupply) {
        balances[msg.sender] = 0;                            // Give the creator all initial tokens
        totalSupply = _totalSupply;                          // Update total supply
    }

    function mintTokens(uint256 _amount, address _recipient) returns (bool) {
        balances[_recipient] += _amount;
        return true;
    }
}