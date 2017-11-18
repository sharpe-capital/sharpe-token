var Migrations = artifacts.require("./Migrations.sol");

module.exports = async function(deployer, network, accounts) {
    if(network == "coverage" || network == "development") {
        return;
    }
    deployer.deploy(Migrations);
};