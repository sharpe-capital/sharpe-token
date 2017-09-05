pragma solidity ^0.4.11;

import '../PreSale.sol';

// @dev PreSaleMock mocks current block number

contract PreSaleMock is PreSale {

    function PreSaleMock() PreSale() {
        mock_time = now;
    }

    function getBlockNumber() internal constant returns (uint) {
        return mock_blockNumber;
    }

    function setMockedBlockNumber(uint _b) public {
        mock_blockNumber = _b;
    }

    function getTime() public returns (uint) {
        return mock_time;
    }

    function setMockedTime(uint _t) public {
        mock_time = _t;
    }

    uint mock_time;
    uint mock_blockNumber = 1;
}