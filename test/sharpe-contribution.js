const SharpeContribution = artifacts.require("SharpeContribution");
const SHP = artifacts.require("SHP");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const assertFail = require("./helpers/assertFail");

function round(value) {
    const multiplier = 100;
    if(typeof(value) != 'number') {
        value = Number(value);
    }
    return Math.round(value * multiplier) / multiplier;
}

contract("SharpeContribution", function(accounts) {

    // accounts.forEach(account => console.log(web3.fromWei(web3.eth.getBalance(account).toNumber())))

    const etherEscrowAddress = accounts[1];
    const foundersAddress = accounts[2];
    const reserveAddress = accounts[3];
    const contributorOneAddress = accounts[4];
    const contributorTwoAddress = accounts[5];

    let multisigEtherEscrow;
    let multisigFounders;
    let multisigReserve;
    let miniMeTokenFactory;
    let shp;
    let sharpeContribution;
    let sharpeContributionAddress;

    it('deploys all contracts with correct addresses', async function() {

        miniMeTokenFactory = await MiniMeTokenFactory.new();
        shp = await SHP.new(miniMeTokenFactory.address);
        sharpeContribution = await SharpeContribution.new();
        sharpeContributionAddress = sharpeContribution.address;

        etherEscrowWallet = await MultiSigWallet.new([etherEscrowAddress], 1);
        foundersWallet = await MultiSigWallet.new([foundersAddress], 1);
        reserveWallet = await MultiSigWallet.new([reserveAddress], 1);
        contributorOneWallet = await MultiSigWallet.new([contributorOneAddress], 1);
        contributorTwoWallet = await MultiSigWallet.new([contributorTwoAddress], 1);
        sharpeContributionWallet = await MultiSigWallet.new([sharpeContributionAddress], 1);

        await sharpeContribution.initialize(
            etherEscrowWallet.address, 
            reserveWallet.address, 
            foundersWallet.address,
            sharpeContributionWallet.address);
    });

    it('should have correct addresses', async function() {

        const contributionAddr = await sharpeContribution.contributionAddress();
        const etherEscrowAddr = await sharpeContribution.etherEscrowAddress();
        const foundersAddr = await sharpeContribution.founderAddress();
        const reserveAddr = await sharpeContribution.reserveAddress();

        assert.equal(contributionAddr, sharpeContributionWallet.address);
        assert.equal(etherEscrowAddr, etherEscrowWallet.address);
        assert.equal(foundersAddr, foundersWallet.address);
        assert.equal(reserveAddr, reserveWallet.address);
    });

    it('should have correct initial balances', async function() {

        const contributionBalance = web3.fromWei(web3.eth.getBalance(sharpeContribution.address).toNumber());
        const etherEscrowBalance = web3.fromWei(web3.eth.getBalance(etherEscrowAddress).toNumber());
        const foundersBalance = web3.fromWei(web3.eth.getBalance(foundersAddress).toNumber());
        const reserveBalance = web3.fromWei(web3.eth.getBalance(reserveAddress).toNumber());
        const contributorOneBalance = web3.fromWei(web3.eth.getBalance(contributorOneAddress).toNumber());
        const contributorTwoBalance = web3.fromWei(web3.eth.getBalance(contributorTwoAddress).toNumber());

        assert.equal(Math.round(contributionBalance), 0);
        assert.equal(Math.round(etherEscrowBalance), 100);
        assert.equal(Math.round(foundersBalance), 100);
        assert.equal(Math.round(reserveBalance), 100);
        assert.equal(Math.round(contributorOneBalance), 100);
        assert.equal(Math.round(contributorTwoBalance), 100);
    });

    // it('should not accept contributions from contribution address', async function() {
    //     await assertFail(async function() {
    //         await shp.sendTransaction({
    //             value: web3.toWei(1), 
    //             gas: 300000, 
    //             gasPrice: "20000000000", 
    //             from: sharpeContribution.address
    //         });
    //     });
    // });

    // it('should not accept contributions from ether escrow address', async function() {
    //     await assertFail(async function() {
    //         await shp.sendTransaction({
    //             value: web3.toWei(1), 
    //             gas: 300000, 
    //             gasPrice: "20000000000", 
    //             from: etherEscrowAddress
    //         });
    //     });
    // });

    // it('should not accept contributions from founder address', async function() {
    //     await assertFail(async function() {
    //         await shp.sendTransaction({
    //             value: web3.toWei(1), 
    //             gas: 300000, 
    //             gasPrice: "20000000000", 
    //             from: foundersAddress
    //         });
    //     });
    // });

    // it('should not accept contributions from reserve address', async function() {
    //     await assertFail(async function() {
    //         await sharpeContribution.sendTransaction({
    //             value: web3.toWei(1), 
    //             gas: 300000, 
    //             gasPrice: "20000000000", 
    //             from: reserveAddress
    //         });
    //     });
    // });

    it('should accept Ether from contributor account and generate SHP', async function() {

        await sharpeContribution.sendTransaction({
            value: web3.toWei(1),
            gas: 300000, 
            gasPrice: "20000000000", 
            from: contributorOneAddress
        });

        const etherEscrowBalance = round(web3.fromWei(web3.eth.getBalance(etherEscrowAddress).toNumber()));
        const contributionBalance = round(web3.fromWei(web3.eth.getBalance(sharpeContributionAddress).toNumber()));
        const contributorOneBalance = round(web3.fromWei(web3.eth.getBalance(contributorOneAddress).toNumber()));

        // assert.equal(etherEscrowBalance, 1);
        assert.equal(contributionBalance, 1);
        assert.equal(contributorOneBalance, 99);
    });
});