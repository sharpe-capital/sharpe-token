const SharpeContribution = artifacts.require("SharpeContribution");
const SHP = artifacts.require("SHP");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const FoundersWallet = artifacts.require("FoundersWalletMock");
const ReserveWallet = artifacts.require("ReserveWalletMock");

// Creator address: 0xd4135b5faabc9f58d8e80c1a63903331207d81f3

const masterAddress = '0x486f82b02d7de535054760c4d5ec089a9e06b5b8';

module.exports = async function(deployer, network, accounts) {
    
    if (network === "development") {
        return;
    }

    const sharpeContribution = await SharpeContribution.new();
    const shp = await SHP.new("SHP");
    
    await shp.changeOwner(sharpeContribution.address);

    const etherEscrowWallet = await MultiSigWallet.new([escrowSignAddress], 1);
    const foundersWallet = await FoundersWallet.new(shp.address, sharpeContribution.address); // TODO - could apply multisign to this wallet
    const reserveWallet = await ReserveWallet.new(shp.address, sharpeContribution.address); // TODO - could apply multisign to this wallet
    const contributionAddress = sharpeContribution.address;
    const etherEscrowAddress = etherEscrowWallet.address;
    const foundersAddress = foundersWallet.address;
    const reserveAddress = reserveWallet.address;

    console.log('Contribution address:', contributionAddress);
    console.log('Ether escrow address:', etherEscrowAddress);
    console.log('Founders SHP address:', foundersAddress);
    console.log('Reserve SHP address:', reserveAddress);
    console.log('SHP token address:', shp.address);

    await sharpeContribution.initialize(
        etherEscrowWallet.address, 
        reserveWallet.address, 
        foundersWallet.address, 
        sharpeContribution.address,
        masterAddress,
        shp.address);
};



// var SharpeContribution = artifacts.require("./SharpeContribution.sol");
// var SHP = artifacts.require("./SHP.sol");

// module.exports = async function(deployer, network, accounts) {
//     if (network === "development") {
//         return;
//     }
//     deployer.deploy(SharpeContribution);
//     deployer.deploy(SHP, "SHP");
// };