var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {
    console.log("DEPLOY", deployer);
    console.log("NETWORK",network);
    console.log("ACCOUNTS", accounts);
    deployer.deploy(Migrations);
};