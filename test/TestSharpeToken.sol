// pragma solidity ^0.4.2;

// import "truffle/Assert.sol";
// import "truffle/DeployedAddresses.sol";
// import "../contracts/SharpeToken.sol";

// contract TestSharpeToken {

//     function testBalanceWithDeployedSharpeToken() {
//         SharpeToken token = SharpeToken(DeployedAddresses.SharpeToken());
//         assertToken(token);
//     }

//     function testBalanceWithNewSharpeToken() {
//         SharpeToken token = new SharpeToken(10000);
//         assertToken(token);
//     }

//     function assertToken(SharpeToken token) {
//         Assert.equal(token.getBalance(tx.origin), 10000, "Token has the wrong balance");
//     }
// }