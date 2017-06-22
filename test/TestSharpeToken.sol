pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SharpeToken.sol";

contract TestSharpeToken {

    function testInitialBalanceUsingDeployedContract() {
        SharpeToken meta = SharpeToken(DeployedAddresses.SharpeToken());
        uint expected = 10000;
        Assert.equal(meta.getBalance(tx.origin), expected, "Owner should have 10000 Sharpe tokens initially");
    }

    function testInitialBalanceWithNewSharpeToken() {
        SharpeToken meta = new SharpeToken(10000);
        uint expected = 10000;
        Assert.equal(meta.getBalance(tx.origin), expected, "Owner should have 10000 MetaCoin initially");
    }
}