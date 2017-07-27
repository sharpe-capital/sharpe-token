const SharpeContribution = artifacts.require("./SharpeContribution.sol");
const SHP = artifacts.require("./SHP.sol");
const MultiSigWallet = artifacts.require("./MultiSigWallet");
const FoundersWallet = artifacts.require("./FoundersWallet");
const ReserveWallet = artifacts.require("./ReserveWallet");

const masterAddress = '0x486f82b02d7de535054760c4d5ec089a9e06b5b8';
const escrowSignAddress = '0x1be1d188b740562280ec4664d560783b4455587c';

module.exports = async function(deployer, network, accounts) {

    if (network === "development") {
        return;
    }

    await deployer.deploy(SharpeContribution);
    await deployer.deploy(SHP, "SHP");

    const contribution = await SharpeContribution.deployed();
    const shp = await SHP.deployed();

    await shp.changeOwner(contribution.address);
    await deployer.deploy(MultiSigWallet, [escrowSignAddress], 1);
    await deployer.deploy(FoundersWallet, shp.address, contribution.address);
    await deployer.deploy(ReserveWallet, shp.address, contribution.address);
    
    const etherEscrowWallet = await MultiSigWallet.deployed();
    const foundersWallet = await FoundersWallet.deployed();
    const reserveWallet = await ReserveWallet.deployed();

    const etherEscrowAddress = etherEscrowWallet.address;
    const foundersAddress = foundersWallet.address;
    const reserveAddress = reserveWallet.address;

    console.log('Contribution address:', contribution.address);
    console.log('SHP token address:', shp.address);
    console.log('Ether escrow address:', etherEscrowAddress);
    console.log('Founders SHP address:', foundersAddress);
    console.log('Reserve SHP address:', reserveAddress);

    await contribution.initialize(
        etherEscrowWallet.address, 
        reserveWallet.address, 
        foundersWallet.address, 
        contribution.address,
        masterAddress,
        shp.address);
};