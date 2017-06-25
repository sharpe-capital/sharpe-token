pragma solidity ^0.4.11;

import '../ReserveWallet.sol';

// @dev ReserveWalletMock mocks current time

contract ReserveWalletMock is ReserveWallet {

    uint mock_time;

    function ReserveWalletMock(address _shp, SharpeContribution _contribution)
    ReserveWallet(_shp, _contribution) {
        mock_time = now;
    }

    function getTime() internal returns (uint) {
        return mock_time;
    }

    function setMockedTime(uint _t) {
        mock_time = _t;
    }
}