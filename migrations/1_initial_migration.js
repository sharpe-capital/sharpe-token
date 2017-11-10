var Migrations = artifacts.require("./Migrations.sol");
var SharpeCrowdsale = artifacts.require("./SharpeCrowdsale.sol");
var abi = require('ethereumjs-abi');

module.exports = async function(deployer, network, accounts) {

    if(network == "coverage" || network == "development") {
        return;
    }

    const ethRate = 300;
    const etherEscrowAddress = "0x28350c8ce237bc205b990a40266b46fe65197db4";
    const bountyAddress = "0x762f11b6509fbb0f7a90b5ba80d3add087bebff5";
    const trusteeAddress = "0x6d15a5f9c98e272686a5b241bc31516514e18b30";
    const minDiscount = web3.toWei(1500 / ethRate);
    const firstTierDiscount = web3.toWei(10000 / ethRate);
    const secondTierDiscount = web3.toWei(50000 / ethRate);
    const thirdTierDiscount = web3.toWei(250000 / ethRate);
    const minContribution = web3.toWei(100 / ethRate);
    const maxContribution = web3.toWei(500000 / ethRate);
    const shpRate = 5000;

    this.sharpeCrowdsale = await SharpeCrowdsale.new(
        etherEscrowAddress,
        bountyAddress,
        trusteeAddress,
        minDiscount,
        firstTierDiscount,
        secondTierDiscount,
        thirdTierDiscount,
        minContribution,
        maxContribution,
        shpRate
    );

    console.log('Deployed the Sharpe crowdsale: ' + this.sharpeCrowdsale.address);

    console.log("Crowdsale ABI arguments: ", 
    abi.rawEncode([
        "address",
        "address",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256"
    ], [
        etherEscrowAddress,
        bountyAddress,
        trusteeAddress,
        minDiscount,
        firstTierDiscount,
        secondTierDiscount,
        thirdTierDiscount,
        minContribution,
        maxContribution,
        shpRate
    ]).toString('hex'));

    deployer.deploy(Migrations);
};