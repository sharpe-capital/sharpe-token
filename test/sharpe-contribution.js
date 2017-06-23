const SharpeContribution = artifacts.require("SharpeContribution");
const SHP = artifacts.require("SHP");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");

contract("SharpeContribution", function(accounts) {

    const etherEscrowAddress = accounts[1];
    const foundersAddress = accounts[2];
    const reserveAddress = accounts[3];

    let multisigEtherEscrow;
    let multisigFounders;
    let multisigReserve;
    let miniMeTokenFactory;
    let shp;
    let sharpeContribution;

    it('deploys all contracts with correct addresses', async function() {

        multisigEtherEscrow = await MultiSigWallet.new([etherEscrowAddress], 1);
        multisigFounders = await MultiSigWallet.new([foundersAddress], 1);
        multisigReserve = await MultiSigWallet.new([reserveAddress], 1);
        miniMeTokenFactory = await MiniMeTokenFactory.new();
        shp = await SHP.new(miniMeTokenFactory.address);
        sharpeContribution = await SharpeContribution.new();

        await sharpeContribution.initialize(
            multisigEtherEscrow.address, 
            multisigReserve.address, 
            multisigFounders.address,
            sharpeContribution.address);
    });

    it('should have correct addresses', async function() {

        const contributionAddr = await sharpeContribution.contributionAddress();
        const etherEscrowAddr = await sharpeContribution.etherEscrowAddress();
        const foundersAddr = await sharpeContribution.founderAddress();
        const reserveAddr = await sharpeContribution.reserveAddress();

        assert.equal(contributionAddr, sharpeContribution.address);
        assert.equal(etherEscrowAddr, multisigEtherEscrow.address);
        assert.equal(foundersAddr, multisigFounders.address);
        assert.equal(reserveAddr, multisigReserve.address);
    });

    it('should have correct initial balances', async function() {

        const contributionBalance = web3.fromWei(web3.eth.getBalance(sharpeContribution.address).toNumber());
        const etherEscrowBalance = web3.fromWei(web3.eth.getBalance(etherEscrowAddress).toNumber());
        const foundersBalance = web3.fromWei(web3.eth.getBalance(foundersAddress).toNumber());
        const reserveBalance = web3.fromWei(web3.eth.getBalance(reserveAddress).toNumber());

        assert.equal(contributionBalance, 0);
        assert.equal(etherEscrowBalance, 100);
        assert.equal(foundersBalance, 100);
        assert.equal(reserveBalance, 100);
    });
});