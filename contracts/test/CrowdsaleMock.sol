pragma solidity ^0.4.11;

import '../Crowdsale.sol';

// @dev FoundersWalletMock mocks current block number

contract CrowdsaleMock is Crowdsale {

    function CrowdsaleMock() Crowdsale() {}

    function getBlockNumber() internal constant returns (uint) {
        return mock_blockNumber;
    }

    function setMockedBlockNumber(uint _b) public {
        mock_blockNumber = _b;
    }

    uint mock_blockNumber = 1;
}