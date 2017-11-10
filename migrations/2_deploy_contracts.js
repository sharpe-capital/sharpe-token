// Contracts:
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("./MiniMeToken.sol");
const SharpeCrowdsale = artifacts.require("./SharpeCrowdsale.sol");
const SHP = artifacts.require("./SHP.sol");
const SCD = artifacts.require("./SCD.sol");
const AffiliateUtility = artifacts.require("./AffiliateUtility.sol");
const DynamicCeiling = artifacts.require("./DynamicCeiling.sol");
const SharpePresale = artifacts.require("./SharpePresale.sol");
const SHPController = artifacts.require("./SHPController.sol");
const TokenSale = artifacts.require("./TokenSale.sol");
const Owned = artifacts.require("./Owned.sol");
const SafeMath = artifacts.require("./SafeMath.sol");
const Trustee = artifacts.require("./Trustee.sol");
const MultiSigWallet = artifacts.require("./MultiSigWallet");

//Keys
const Keys = require("./keys.json");

// ABI GENERATOR
var abi = require('ethereumjs-abi')

// Addresses
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



/////////
//// Live Values
////////
// Ether to Dollar Value
const etherPeggedValue = 300;

// Affiliate Tiers
const affiliateTierTwo = web3.toWei(1) * (20000 / etherPeggedValue);
const affiliateTierThree = web3.toWei(1) * (50000 / etherPeggedValue);

//PRESALE VALUSE:
const MIN_PRESALE_CONTRIBUTION = 10000;
const MAX_PRESALE_CONTRIBUTION = 500000;
const FIRST_TIER_DISCOUNT_UPPER_LIMIT = 49999;
const SECOND_TIER_DISCOUNT_UPPER_LIMIT = 249999;
const THIRD_TIER_DISCOUNT_UPPER_LIMIT = 500000;
const PRESALE_CAP = 0;
const honourWhitelistEnd = new Date(2017, 10, 8, 13, 59, 59, 0).getTime();

//GENEARL SALE VALUES
const MIN_GENERAL_SALE_CONTRIBUTION = 100;


/////////
//// Test Values
////////
// const etherPeggedValue = 1;

// // Affiliate Tiers
// const affiliateTierTwo = web3.toWei(1) * 0.5;
// const affiliateTierThree = web3.toWei(1) * 1;

// //PRESALE VALUSE:
// const MIN_PRESALE_CONTRIBUTION = 1;
// const MAX_PRESALE_CONTRIBUTION = 3;
// const FIRST_TIER_DISCOUNT_UPPER_LIMIT = 1.4;
// const SECOND_TIER_DISCOUNT_UPPER_LIMIT = 1.9;
// const THIRD_TIER_DISCOUNT_UPPER_LIMIT = 3;
// const PRESALE_CAP = 10;
// const honourWhitelistEnd = new Date(2017, 10, 23, 9, 0, 0, 0).getTime();

// //GENEARL SALE VALUES
// const MIN_GENERAL_SALE_CONTRIBUTION = 0.01;
// const MAX_GENERAL_SALE_CONTRIBUTION = 3;
// const GENERAL_SALE_HARDCAP = 15;

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
    
    let affiliateUtility = await AffiliateUtility.new(affiliateTierTwo, affiliateTierThree);
    let affiliateUtilityAddress = await affiliateUtility.address;
    console.log("AffiliateUtility" + " has been deployed to: " + affiliateUtilityAddress);

    //SHP Controller
    await shpController.setContracts(shp.address, trusteeWalletAddress);

    //Presale
    let presale = await SharpePresale.new(
        etherEscrowAddress,
        bountyWalletAddress,
        trusteeWalletAddress,
        affiliateUtilityAddress,
        apiAddress,
        web3.toWei(FIRST_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(SECOND_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(THIRD_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(MIN_PRESALE_CONTRIBUTION / etherPeggedValue),
        web3.toWei(MAX_PRESALE_CONTRIBUTION / etherPeggedValue),
        0,
        honourWhitelistEnd
    );
    let presaleAddress = await presale.address;
    console.log("PreSale" + " has been deployed to: " + presaleAddress )

    // General Sale
    let minContributionInWei = web3.toWei(MIN_GENERAL_SALE_CONTRIBUTION / etherPeggedValue);
   
    let generalSale = await SharpeCrowdsale.new(
        etherEscrowAddress,
        bountyWalletAddress,
        trusteeWalletAddress,
        affiliateUtilityAddress,
        apiAddress,
        minContributionInWei);
    
    let generalSaleAddress = await generalSale.address;
    console.log("GeneralSale" + " has been deployed to: " + generalSaleAddress);

    let dynamicCeiling = await DynamicCeiling.new(masterAddress,generalSaleAddress);
    let dynamicCeilingAddress = await dynamicCeiling.address;

    console.log("DYNAMIC CEILIENG ABI ARGUMENTS: ", 
    abi.rawEncode(["address","address"], [masterAddress,generalSaleAddress]).toString('hex'));

    console.log("FOUNDERS MULTISIG ABI ARGUMENTS: ", 
    abi.rawEncode(["address[]","uint"], [foundersAddresses,foundersRequiredSigs]).toString('hex'));

    console.log("RESERVE MULTISIG ABI ARGUMENTS: ", 
    abi.rawEncode(["address[]","uint"], [reserveAddresses,reserveRequiredSigs]).toString('hex'));

    console.log("ETHER MULTISIG ABI ARGUMENTS: ", 
    abi.rawEncode(["address[]","uint"], [ethAddresses,ethRequiredSigs]).toString('hex'));

    console.log("BOUNTY MULTISIG ABI ARGUMENTS: ", 
    abi.rawEncode(["address[]","uint"], [bountyAddresses,bountyRequiredSigs]).toString('hex'));

    await generalSale.setDynamicCeilingAddress(dynamicCeiling.address);
    console.log("Dynamic Ceiling" + " has been deployed to: " + dynamicCeilingAddress);

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
    console.log("AffiliateUtility" + " has been deployed to: " + affiliateUtilityAddress);
    console.log("SHP" + "has been deployed to: " + shpAddress);
    console.log("PreSale" + " has been deplo;yed to: " + presaleAddress );
    console.log("GeneralSale" + " has been deployed to: " + generalSaleAddress);
    console.log("Dynamic Ceiling" + " has been deployed to: " + dynamicCeilingAddress);
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
   
    // console.log("AFIILIATES ABI ARGUMENTS: ", 
    // abi.rawEncode(["uint256","uint256"], [affiliateTierTwo,affiliateTierThree]).toString('hex'));
   
    console.log("PRESALE ABI ARGUMENTS: ", 
    abi.rawEncode(["address",
    "address",
    "address",
    "address",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256"], 
    [etherEscrowAddress,
        bountyWalletAddress,
        trusteeWalletAddress,
        affiliateUtilityAddress,
        apiAddress,
        web3.toWei(FIRST_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(SECOND_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(THIRD_TIER_DISCOUNT_UPPER_LIMIT / etherPeggedValue),
        web3.toWei(MIN_PRESALE_CONTRIBUTION / etherPeggedValue),
        web3.toWei(MAX_PRESALE_CONTRIBUTION / etherPeggedValue),
        web3.toWei(PRESALE_CAP / etherPeggedValue),
        honourWhitelistEnd
    ]).toString('hex'));
    
    console.log("GENERALSALE ABI ARGUMENTS: ", 
    abi.rawEncode(["address",
    "address",
    "address",
    "address",
    "uint256"], 
    [etherEscrowAddress,
        bountyWalletAddress,
        trusteeWalletAddress,
        affiliateUtilityAddress,
        apiAddress,
        minContributionInWei
    ]).toString('hex'));
};