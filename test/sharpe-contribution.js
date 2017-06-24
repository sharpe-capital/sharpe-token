const SharpeContribution = artifacts.require("SharpeContribution");
const SharpeToken = artifacts.require("SharpeToken");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const assertFail = require("./helpers/assertFail");

function round(value) {
    const multiplier = 100;
    if(typeof(value) != 'number') {
        value = Number(value);
    }
    return Math.round(value * multiplier) / multiplier;
}

function roundFromWei(value) {
    return round(web3.fromWei(value));
}

function getRoundedBalance(address) {
    return roundFromWei(web3.eth.getBalance(address).toNumber());
}

contract("SharpeContribution", function(accounts) {

    console.log('Logging out all of the accounts for reference...');
    accounts.forEach(acc => console.log(acc));

    const etherEscrowAddress = accounts[1];
    const foundersAddress = accounts[2];
    const reserveAddress = accounts[3];
    const contributorOneAddress = accounts[4];
    const contributorTwoAddress = accounts[5];
    const contributionAddress = accounts[6];

    let etherEscrowWallet;
    let foundersWallet;
    let reserveWallet;
    let contributionWallet;
    let sharpeContribution;
    let miniMeTokenFactory;
    let shp;

    beforeEach(async function() {

        sharpeContribution = await SharpeContribution.new();
        shp = await SharpeToken.new("SHP");
        
        shp.changeOwner(sharpeContribution.address);

        etherEscrowWallet = await MultiSigWallet.new([etherEscrowAddress], 1);
        foundersWallet = await MultiSigWallet.new([foundersAddress], 1);
        reserveWallet = await MultiSigWallet.new([reserveAddress], 1);

        await sharpeContribution.initialize(
            etherEscrowWallet.address, 
            reserveWallet.address, 
            foundersWallet.address, 
            sharpeContribution.address,
            shp.address);
    });

    // it('deploys all contracts with correct addresses', async function() {

    //     sharpeContribution = await SharpeContribution.new();
    //     shp = await SharpeToken.new("SHP");
        
    //     shp.changeOwner(sharpeContribution.address);

    //     etherEscrowWallet = await MultiSigWallet.new([etherEscrowAddress], 1);
    //     foundersWallet = await MultiSigWallet.new([foundersAddress], 1);
    //     reserveWallet = await MultiSigWallet.new([reserveAddress], 1);

    //     await sharpeContribution.initialize(
    //         etherEscrowWallet.address, 
    //         reserveWallet.address, 
    //         foundersWallet.address, 
    //         sharpeContribution.address,
    //         shp.address);
    // });

    it('should have correct addresses', async function() {

        const contributionAddr = await sharpeContribution.contributionAddress();
        const etherEscrowAddr = await sharpeContribution.etherEscrowAddress();
        const foundersAddr = await sharpeContribution.founderAddress();
        const reserveAddr = await sharpeContribution.reserveAddress();

        assert.equal(contributionAddr, sharpeContribution.address);
        assert.equal(etherEscrowAddr, etherEscrowWallet.address);
        assert.equal(foundersAddr, foundersWallet.address);
        assert.equal(reserveAddr, reserveWallet.address);
    });

    it('should have correct initial balances', async function() {

        const contributionBalance = web3.fromWei(web3.eth.getBalance(contributionAddress).toNumber());
        const etherEscrowBalance = web3.fromWei(web3.eth.getBalance(etherEscrowAddress).toNumber());
        const foundersBalance = web3.fromWei(web3.eth.getBalance(foundersAddress).toNumber());
        const reserveBalance = web3.fromWei(web3.eth.getBalance(reserveAddress).toNumber());
        const contributorOneBalance = web3.fromWei(web3.eth.getBalance(contributorOneAddress).toNumber());
        const contributorTwoBalance = web3.fromWei(web3.eth.getBalance(contributorTwoAddress).toNumber());

        assert.equal(Math.round(contributionBalance), 100);
        assert.equal(Math.round(etherEscrowBalance), 100);
        assert.equal(Math.round(foundersBalance), 100);
        assert.equal(Math.round(reserveBalance), 100);
        assert.equal(Math.round(contributorOneBalance), 100);
        assert.equal(Math.round(contributorTwoBalance), 100);
    });

    it('should not accept contributions from contribution address', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: sharpeContribution.address
            });
        });
    });

    it('should not accept contributions from ether escrow address', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: etherEscrowWallet.address
            });
        });
    });

    it('should not accept contributions from founder address', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: foundersWallet.address
            });
        });
    });

    it('should not accept contributions from reserve address', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: reserveWallet.address
            });
        });
    });

    it('should accept Ether from contributor account and generate SHP', async function() {

        await sharpeContribution.sendTransaction({
            value: web3.toWei(10),
            gas: 300000, 
            gasPrice: "20000000000", 
            from: contributorOneAddress
        });

        const etherEscrowBalance = getRoundedBalance(etherEscrowWallet.address);
        const contributionBalance = getRoundedBalance(sharpeContribution.address);
        const contributorOneBalance = getRoundedBalance(contributorOneAddress);
        const contributorOne_SHP = roundFromWei(await shp.balanceOf(contributorOneAddress));
        const reserve_SHP = roundFromWei(await shp.balanceOf(reserveWallet.address));
        const founders_SHP = roundFromWei(await shp.balanceOf(foundersWallet.address));

        assert.equal(contributorOne_SHP, 20000);
        assert.equal(reserve_SHP, 20000);
        assert.equal(founders_SHP, 10000);
        assert.equal(etherEscrowBalance, 10);
        assert.equal(contributionBalance, 0);
        assert.equal(contributorOneBalance, 90);
    });

    it('should prevent 0 ETH contributions', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: 0,
                gas: 300000, 
                gasPrice: "20000000000", 
                from: contributorOneAddress
            });
        });
    });
});