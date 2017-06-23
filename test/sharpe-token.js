// const SharpeToken = artifacts.require("SharpeToken");

// contract("SharpeToken", function(accounts) {

//     it("should create initial Sharpe token with expected details", async function() {

//         const instance = await SharpeToken.deployed();
//         const balance = await instance.getBalance.call(accounts[0]);
//         const name = await instance.name();
//         const decimals = await instance.decimals();
//         const symbol = await instance.symbol();
//         const version = await instance.version();

//         assert.equal(balance, 10000, "10000 wasn't in the first account");
//         assert.equal(name, "Sharpe Token", "Name was not Sharpe Token");
//         assert.equal(decimals, 18, "Decimals was not 18");
//         assert.equal(symbol, "SHP", "Symbol was not SHP");
//         assert.equal(version, "v1.0", "Version was not v1.0");
//     });
// });