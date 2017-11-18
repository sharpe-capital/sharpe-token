// Contracts:
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("./MiniMeToken.sol");
const SharpeCrowdsale = artifacts.require("./SharpeCrowdsale.sol");
const SHP = artifacts.require("./SHP.sol");
const SHPController = artifacts.require("./SHPController.sol");
const TokenSale = artifacts.require("./TokenSale.sol");
const Owned = artifacts.require("./Owned.sol");
const SafeMath = artifacts.require("./SafeMath.sol");
const Trustee = artifacts.require("./Trustee.sol");
const MultiSigWallet = artifacts.require("./MultiSigWallet");

// //Keys
const Keys = require("./testnet-keys.json");

// // ABI GENERATOR
var abi = require('ethereumjs-abi');

// // Addresses
const masterAddress = Keys.master; 
const apiAddress = Keys.api;
const bountyAddresses = [Keys.bounty.i,Keys.bounty.j,Keys.bounty.l];
const bountyRequiredSigs = Keys.bounty.req;
const ethAddresses = [Keys.ether.i,Keys.ether.j,Keys.ether.l,Keys.ether.taas];
const ethRequiredSigs = Keys.ether.req;
const foundersAddresses = [Keys.founders.i,Keys.founders.j,Keys.founders.l];
const foundersRequiredSigs = Keys.founders.req;
const reserveAddresses = [Keys.reserve.i,Keys.reserve.j,Keys.reserve.l,Keys.reserve.taas];
const reserveRequiredSigs = Keys.reserve.req;

module.exports = async function(deployer, network, accounts) {

    console.log("ADRESSES");
    console.log("------------------------------")
    console.log("masterAddress", masterAddress);
    console.log("bountyAddresses", bountyAddresses);
    console.log("bountyRequiredSigs", bountyRequiredSigs);
    console.log("ethAddresses", ethAddresses);
    console.log("ethRequiredSigs", ethRequiredSigs);
    console.log("foundersAddresses", foundersAddresses);
    console.log("foundersRequiredSigs", foundersRequiredSigs);
    console.log("reserveAddresses", reserveAddresses);
    console.log("reserveRequiredSigs", reserveRequiredSigs);
    console.log("------------------------------")

    console.log("__________________________________________")
    console.log("*************Begin Migration**************")
    console.log("__________________________________________")
    console.log("deploying on network: " + network);

    var parameterTypes = [];
    var parameterValues = [];
    
    if(network == "coverage" || network == "development") {
        return;
    }

    //SHP Token
    let miniMeTokenFactory = await MiniMeTokenFactory.new();
    let shp = await SHP.new(miniMeTokenFactory.address);
    let shpAddress = await shp.address;
    console.log("SHP" + " has been deployed to: " + shpAddress);

    //General Setup
    let etherEscrowWallet = await MultiSigWallet.new(ethAddresses, ethRequiredSigs);
    let etherEscrowAddress = await etherEscrowWallet.address;
    console.log("Ether Escrow Wallet" + " has been deployed to: " + etherEscrowAddress);

    let bountyWallet = await MultiSigWallet.new(bountyAddresses, bountyRequiredSigs);
    let bountyWalletAddress = await bountyWallet.address;
    console.log("bountyWallet" + " has been deployed to: " + bountyWalletAddress );

    let foundersWallet = await MultiSigWallet.new(foundersAddresses, foundersRequiredSigs);
    let foundersAddress = await foundersWallet.address;
    console.log("Founders Wallet" + " has been deployed to: " + foundersAddress);

    let reserveWallet = await MultiSigWallet.new(reserveAddresses, reserveRequiredSigs);
    let reserveAddress = await reserveWallet.address;
    console.log("Reserve Wallet" + " has been deployed to: " + reserveAddress );

    let trusteeWallet = await Trustee.new(shpAddress);
    let trusteeWalletAddress = await trusteeWallet.address;
    console.log("Trustee Wallet" + " has been deployed to: " + trusteeWalletAddress );

    
    let shpController = await SHPController.new(reserveAddress, foundersAddress);
    let shpControllerAddress = await shpController.address;
    console.log("SHPController" + " has been deployed to: " + shpControllerAddress);

    //SHP Controller
    await shpController.setContracts(shp.address, trusteeWalletAddress);

    const ethRate = 300;
    const minDiscount = web3.toWei(1500 / ethRate);
    const firstTierDiscount = web3.toWei(10000 / ethRate);
    const secondTierDiscount = web3.toWei(50000 / ethRate);
    const thirdTierDiscount = web3.toWei(250000 / ethRate);
    const minContribution = web3.toWei(100 / ethRate);
    const maxContribution = web3.toWei(500000 / ethRate);
    const shpRate = 5000;

    let sharpeCrowdsale = await SharpeCrowdsale.new(
        etherEscrowAddress,
        bountyWalletAddress,
        trusteeWalletAddress,
        minDiscount,
        firstTierDiscount,
        secondTierDiscount,
        thirdTierDiscount,
        minContribution,
        maxContribution,
        shpRate
    );

    await sharpeCrowdsale.setShp(shpAddress, {
        from: masterAddress
    });

    console.log("FOUNDERS MULTISIG ABI ARGUMENTS: ", 
    abi.rawEncode(["address[]","uint"], [foundersAddresses,foundersRequiredSigs]).toString('hex'));

    console.log("RESERVE MULTISIG ABI ARGUMENTS: ", 
    abi.rawEncode(["address[]","uint"], [reserveAddresses,reserveRequiredSigs]).toString('hex'));

    console.log("ETHER MULTISIG ABI ARGUMENTS: ", 
    abi.rawEncode(["address[]","uint"], [ethAddresses,ethRequiredSigs]).toString('hex'));

    console.log("BOUNTY MULTISIG ABI ARGUMENTS: ", 
    abi.rawEncode(["address[]","uint"], [bountyAddresses,bountyRequiredSigs]).toString('hex'));

    // Log all addresses:
    console.log("__________________________________________")
    console.log("********Completed Deploying Contracts*****")
    console.log("__________________________________________")
    console.log("Ether Escrow Wallet" + " has been deployed to: " + etherEscrowAddress);
    console.log("bountyWallet" + " has been deployed to: " + bountyWalletAddress );
    console.log("Founders Wallet" + " has been deployed to: " + foundersAddress);
    console.log("Reserve Wallet" + " has been deployed to: " + reserveAddress );
    console.log("Trustee Wallet" + " has been deployed to: " + trusteeWalletAddress );
    console.log("SHPController" + " has been deployed to: " + shpControllerAddress);
    console.log("SHP" + "has been deployed to: " + shpAddress);
    console.log("__________________________________________");
    console.log("__________________________________________");

    console.log("__________________________________________");
    console.log("********ABI ARGUMENTS*****");
    console.log("__________________________________________");
    console.log("SHP ABI ARGUMENTS: ", 
    abi.rawEncode(["address"], [miniMeTokenFactory.address]).toString('hex'));
   
    console.log("TRUSTEE ABI ARGUMENTS: ", abi.rawEncode(["address"], [shpAddress]).toString('hex'));
   
    console.log("SHP Controller ABI ARGUMENTS: ", 
    abi.rawEncode(["address","address"], [reserveAddress,foundersAddress]).toString('hex'));

    console.log('Deployed the Sharpe crowdsale: ' + sharpeCrowdsale.address);
    
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
        bountyWalletAddress,
        trusteeWalletAddress,
        minDiscount,
        firstTierDiscount,
        secondTierDiscount,
        thirdTierDiscount,
        minContribution,
        maxContribution,
        shpRate
    ]).toString('hex'));
};