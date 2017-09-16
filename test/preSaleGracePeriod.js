const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("Presale grace period transaction", function(accounts) {

    before(async function() {
        await testConfig.setupForPreSale(accounts, true);
    });

    it('should initialize contract with expected values', async function() {
        await assertions.expectedInitialisation(
            testConfig.preSale, 
            {
                etherEscrowWallet: testConfig.etherEscrowWallet,
                reserveWallet: testConfig.reserveWallet,
                foundersWallet: testConfig.foundersWallet
            },
            {
                preSaleBegin: testConfig.preSaleBegin,
                preSaleEnd: testConfig.preSaleEnd,
                preSaleCap: testConfig.preSaleCap,
                minPresaleContributionEther: testConfig.minPresaleContributionEther,
                maxPresaleContributionEther: testConfig.maxPresaleContributionEther,
                firstTierDiscountUpperLimitEther: testConfig.firstTierDiscountUpperLimitEther,
                secondTierDiscountUpperLimitEther: testConfig.secondTierDiscountUpperLimitEther,
                thirdTierDiscountUpperLimitEther: testConfig.thirdTierDiscountUpperLimitEther
            }
        );
    });

    it('should allow owner to resume the sale', async function(){
        await testConfig.preSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should enable grace period', async function() {
        await testConfig.preSale.enableGracePeriod({
            from: testConfig.ownerAddress
        });
        assert.equal(true, await testConfig.preSale.gracePeriod());
        assertions.cleanState(testConfig.preSale);
    });

    it('should set the pre-sale cap to 25 ETH', async function() {
        
        let newPresaleCap = web3.toWei('25', 'ether');
        await testConfig.preSale.setPresaleCap(
            newPresaleCap,
            {
                from: testConfig.ownerAddress
            }
        );
        
        let preSaleCap = (await testConfig.preSale.preSaleCap()).toNumber();
        assert.equal(preSaleCap, web3.toWei(25));

        let gracePeriod = await testConfig.preSale.gracePeriod();
        assert.equal(gracePeriod, true);

        let closed = await testConfig.preSale.closed();
        assert.equal(closed, false);
    });

    it('should not allow transaction under minimum', async function() {
        let wei = web3.toWei('1', 'ether');
        let min = web3.fromWei((await testConfig.preSale.minPresaleContributionEther()).toNumber());
        let max = web3.fromWei((await testConfig.preSale.maxPresaleContributionEther()).toNumber());
        assert.equal(min, 1.25);
        assert.equal(max, 12.5);
        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: wei,
                from: testConfig.contributorTwoAddress
            })
        });
        assertions.ether({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 100,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 0,
            bountyBalance: 0
        });
        let cap = web3.fromWei((await testConfig.preSale.preSaleCap()).toNumber());
        assert.equal(cap, 25);
    });

    it('should not allow transaction over maximum', async function() {
        let wei = web3.toWei('13', 'ether');
        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: wei,
                from: testConfig.contributorTwoAddress
            })
        });
        assertions.ether({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 100,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 0,
            bountyBalance: 0
        });
        let cap = web3.fromWei((await testConfig.preSale.preSaleCap()).toNumber());
        assert.equal(cap, 25);
    });

    it('should allow transaction between min and max', async function() {
        let wei = web3.toWei('10', 'ether');
        await testConfig.preSale.sendTransaction({
            value: wei,
            from: testConfig.contributorTwoAddress
        });
        assertions.ether({
            etherEscrowBalance: 10,
            presaleBalance: 0,
            contributorOneBalance: 100,
            contributorTwoBalance: 90,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 26000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 25000,
            bountyBalance: 5000
        });
        let cap = web3.fromWei((await testConfig.preSale.preSaleCap()).toNumber());
        assert.equal(cap, 25);
    });

    it('should allow multiple transactions to exceed the cap', async function() {
        let wei = web3.toWei('10', 'ether');
        await testConfig.preSale.sendTransaction({
            value: wei,
            from: testConfig.contributorTwoAddress
        });
        assertions.ether({
            etherEscrowBalance: 20,
            presaleBalance: 0,
            contributorOneBalance: 100,
            contributorTwoBalance: 80,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 52000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 50000,
            bountyBalance: 10000
        });
        let cap = web3.fromWei((await testConfig.preSale.preSaleCap()).toNumber());
        assert.equal(cap, 25);
    });
});