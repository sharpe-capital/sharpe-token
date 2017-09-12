pragma solidity ^0.4.11;

import "./lib/MiniMeToken.sol";


contract SHP is MiniMeToken {
    // @dev SHP constructor
    function SHP(address _tokenFactory)
            MiniMeToken(
                _tokenFactory,
                0x0,                             // no parent token
                0,                               // no snapshot block number from parent
                "Sharpe Utility Token",          // Token name
                18,                              // Decimals
                "SHP",                           // Symbol
                true                             // Enable transfers
            ) {}
}