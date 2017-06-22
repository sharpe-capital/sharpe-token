const SharpeToken = artifacts.require("SharpeToken");

contract("SharpeToken", function(accounts) {
    it("should put 10000 Sharpe tokens in the first account", function() {
        return SharpeToken.deployed().then(function(instance) {
            return instance.getBalance.call(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
        });
    });
});