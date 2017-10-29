var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {
    console.log("DEPLOY", deployer);
    console.log("NETWORK",network);
    
    deployer.deploy(Migrations);
};