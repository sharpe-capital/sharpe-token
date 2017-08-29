pragma solidity ^0.4.11;

import '../FoundersWallet.sol';

// @dev FoundersWalletMock mocks current time

contract FoundersWalletMock is FoundersWallet {

    uint mock_time;

    function FoundersWalletMock(address _shp, Crowdsale _crowdsale)
    FoundersWallet(_shp, _crowdsale) {
        mock_time = now;
    }

    function getTime() internal returns (uint) {
        return mock_time;
    }

    function setMockedTime(uint _t) {
        mock_time = _t;
    }
}