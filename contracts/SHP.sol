pragma solidity ^0.4.11;

import "./MiniMeToken.sol";

contract SHP is MiniMeToken {

    // @dev SHP constructor just parametrizes the MiniMeIrrevocableVestedToken constructor
    function SHP(address _tokenFactory)
        MiniMeToken(
            _tokenFactory,
            0x0,                     // no parent token
            0,                       // no snapshot block number from parent
            "Sharpe Capital Token",  // Token name
            18,                      // Decimals
            "SHP",                   // Symbol
            true                     // Enable transfers
        ) {}
}
