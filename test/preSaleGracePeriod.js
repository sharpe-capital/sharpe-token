const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("Presale grace period transaction", function(accounts) {

    before(async function() {
        await testConfig.setup(accounts, true);
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

    it('should allow a transaction over cap during grace period', async function() {

        let contribution = web3.toWei('26', 'ether');

        await testConfig.preSale.sendTransaction({
            value: contribution,
            from: testConfig.contributorOneAddress
        });

        assertions.ether({
            etherEscrowBalance: 25,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 65000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 12500
        });

        let gracePeriodEtherPaid = (await testConfig.preSale.gracePeriodEtherPaid()).toNumber();
        assert.equal(gracePeriodEtherPaid, web3.toWei(25));

        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(0));
    });
});