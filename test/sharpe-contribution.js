const SharpeContribution = artifacts.require("SharpeContribution");
const SHP = artifacts.require("SHP");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");

contract("SharpeContribution", function(accounts) {

    const etherEscrowAddress = accounts[0];
    const foundersAddress = accounts[1];
    const reserveAddress = accounts[2];

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

    });
});