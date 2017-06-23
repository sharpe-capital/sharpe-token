var SharpeContribution = artifacts.require("./SharpeContribution.sol");

module.exports = function(deployer, network) {
    if (network === "development") {
        return;
    }
    deployer.deploy(SharpeContribution, 10000);
};