pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SharpeToken.sol";

contract TestSharpeToken {

    function testInitialBalanceUsingDeployedContract() {
        SharpeToken token = SharpeToken(DeployedAddresses.SharpeToken());
        assertBalance(10000, token);
    }

    function testInitialBalanceWithNewSharpeToken() {
        SharpeToken token = new SharpeToken(10000);
        assertBalance(10000, token);
    }

    function assertBalance(uint balance, SharpeToken token) {
        Assert.equal(token.getBalance(tx.origin), balance, "Token has the wrong balance");
    }
}