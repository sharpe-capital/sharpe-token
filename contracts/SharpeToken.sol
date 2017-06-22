pragma solidity ^0.4.8;

import './StandardToken.sol';

/**
 * This contract represents the Sharpe Capital investment token
 */
contract SharpeToken is StandardToken {

    /**
     * TODO - this is how we want to generate our tokens
     */
    function () { 
        // TODO - this is how we want to generate our tokens
    }

    /**
     * Public variables of the token
     */
    string  public name         =   'Sharpe Token';
    uint8   public decimals     =   18;
    string  public symbol       =   'SHP';
    string  public version      =   'v1.0';

	function getBalance(address addr) returns(uint) {
		return balances[addr];
	}

    /**
     * This function executes once, and only once, when the new blockchain is created for the Sharpe token.
     * Upon creation of the blockchain, all of the Sharpe Tokens are initially rewarded to the creating 
     * wallet address.
     */
    function SharpeToken(uint256 initialAmount) {

        balances[tx.origin]     =   initialAmount;
        totalSupply             =   initialAmount;
    }
}