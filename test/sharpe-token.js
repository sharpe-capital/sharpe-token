const SharpeToken = artifacts.require("SharpeToken");

contract("SharpeToken", function(accounts) {
    it("should put 10000 Sharpe tokens in the first account", async function() {

        const instance = await SharpeToken.deployed();
        const balance = await instance.getBalance.call(accounts[0]);
        const name = await instance.name.call();

        assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
        assert.equal(name.valueOf(), "Sharpe Token", "Name was not Sharpe Token");
    });
});