pragma solidity 0.4.15;

import "./lib/MiniMeToken.sol";


contract SCD is MiniMeToken {
    // @dev SCD constructor
    function SCD(address _tokenFactory)
            MiniMeToken(
                _tokenFactory,
                0x0,                             // no parent token
                0,                               // no snapshot block number from parent
                "Sharpe Crypto-Derivative",      // Token name
                18,                              // Decimals
                "SCD",                           // Symbol
                true                             // Enable transfers
            ) {}
}
