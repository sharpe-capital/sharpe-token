const SharpeContribution = artifacts.require("SharpeContribution");
const SharpeToken = artifacts.require("SharpeToken");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const assertFail = require("./helpers/assertFail");

function round(value) {
    const multiplier = 10;
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

    const contributorOneAddress = accounts[1];
    const contributorTwoAddress = accounts[2];
    const escrowSignAddress = accounts[3];
    const reserveSignAddress = accounts[4];
    const foundersSignAddress = accounts[5];

    let etherEscrowWallet;
    let foundersWallet;
    let reserveWallet;
    let sharpeContribution;
    let miniMeTokenFactory;
    let shp;
    let contributionAddress;
    let etherEscrowAddress;
    let foundersAddress;
    let reserveAddress;

    function assertBalances(
        etherEscrowBalance, 
        contributionBalance, 
        contributorOneBalance, 
        contributorTwoBalance,
        reserveBalance,
        foundersBalance) {

        assert.equal(getRoundedBalance(etherEscrowAddress), etherEscrowBalance);
        assert.equal(getRoundedBalance(contributionAddress), contributionBalance);
        assert.equal(getRoundedBalance(contributorOneAddress), contributorOneBalance);
        assert.equal(getRoundedBalance(contributorTwoAddress), contributorTwoBalance);
        assert.equal(getRoundedBalance(reserveAddress), reserveBalance);
        assert.equal(getRoundedBalance(foundersAddress), foundersBalance);
    }

    beforeEach(async function() {

        sharpeContribution = await SharpeContribution.new();
        shp = await SharpeToken.new("SHP");
        
        shp.changeOwner(sharpeContribution.address);

        etherEscrowWallet = await MultiSigWallet.new([escrowSignAddress], 1);
        foundersWallet = await MultiSigWallet.new([foundersSignAddress], 1);
        reserveWallet = await MultiSigWallet.new([reserveSignAddress], 1);
        contributionAddress = sharpeContribution.address;
        etherEscrowAddress = etherEscrowWallet.address;
        foundersAddress = foundersWallet.address;
        reserveAddress = reserveWallet.address;

        await sharpeContribution.initialize(
            etherEscrowWallet.address, 
            reserveWallet.address, 
            foundersWallet.address, 
            sharpeContribution.address,
            shp.address);
    });

    it('should have correct addresses and balances', async function() {

        const contributionAddr = await sharpeContribution.contributionAddress();
        const etherEscrowAddr = await sharpeContribution.etherEscrowAddress();
        const foundersAddr = await sharpeContribution.founderAddress();
        const reserveAddr = await sharpeContribution.reserveAddress();

        assert.equal(contributionAddr, sharpeContribution.address);
        assert.equal(etherEscrowAddr, etherEscrowWallet.address);
        assert.equal(foundersAddr, foundersWallet.address);
        assert.equal(reserveAddr, reserveWallet.address);

        assertBalances(0, 0, 100, 100, 0, 0);
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
        assertBalances(0, 0, 100, 100, 0, 0);
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
        assertBalances(0, 0, 100, 100, 0, 0);
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
        assertBalances(0, 0, 100, 100, 0, 0);
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
        assertBalances(0, 0, 100, 100, 0, 0);
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
        assertBalances(0, 0, 100, 100, 0, 0);
    });

    it('should accept Ether from contributor account and generate SHP', async function() {

        await sharpeContribution.sendTransaction({
            value: web3.toWei(10),
            gas: 300000, 
            gasPrice: "20000000000", 
            from: contributorOneAddress
        });

        const contributorOne_SHP = roundFromWei(await shp.balanceOf(contributorOneAddress));
        const reserve_SHP = roundFromWei(await shp.balanceOf(reserveWallet.address));
        const founders_SHP = roundFromWei(await shp.balanceOf(foundersWallet.address));

        assert.equal(contributorOne_SHP, 20000);
        assert.equal(reserve_SHP, 20000);
        assert.equal(founders_SHP, 10000);

        assertBalances(10, 0, 90, 100, 0, 0);
        // assert.equal(etherEscrowBalance, 10);
        // assert.equal(contributionBalance, 0);
        // assert.equal(contributorOneBalance, 90);
    });
});