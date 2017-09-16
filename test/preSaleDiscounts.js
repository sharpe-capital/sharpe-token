const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("Presale discounts", function(accounts) {

    before(async function() {
        await testConfig.setupForPreSale(accounts, true);
    });

    it('should initialize contract with expected values', async function() {
        await assertions.expectedInitialisation(testConfig.preSale, {
            etherEscrowWallet: testConfig.etherEscrowWallet,
            reserveWallet: testConfig.reserveWallet,
            foundersWallet: testConfig.foundersWallet
        }, {
            preSaleBegin: testConfig.preSaleBegin,
            preSaleEnd: testConfig.preSaleEnd,
            preSaleCap: testConfig.preSaleCap,
            minPresaleContributionEther: testConfig.minPresaleContributionEther,
            maxPresaleContributionEther: testConfig.maxPresaleContributionEther,
            firstTierDiscountUpperLimitEther: testConfig.firstTierDiscountUpperLimitEther,
            secondTierDiscountUpperLimitEther: testConfig.secondTierDiscountUpperLimitEther,
            thirdTierDiscountUpperLimitEther: testConfig.thirdTierDiscountUpperLimitEther
        });
    });

    it('should allow owner to resume the sale', async function(){
        await testConfig.preSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should apply first tier discount', async function() {

        await testConfig.preSale.sendTransaction({
            value: testConfig.firstTierDiscountUpperLimitEther,
            from: testConfig.contributorOneAddress
        });

        assertions.ether({
            etherEscrowBalance: 2.5,
            presaleBalance: 0,
            contributorOneBalance: 97.5,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 5500,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 6250,
            bountyBalance: 1250
        });

        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(2.5));
    });

        
    it('should apply second tier discount', async function() {

        await testConfig.preSale.sendTransaction({
            value: testConfig.secondTierDiscountUpperLimitEther,
            from: testConfig.contributorTwoAddress
        });

        assertions.ether({
            etherEscrowBalance: 7.5,
            presaleBalance: 0,
            contributorOneBalance: 97.5,
            contributorTwoBalance: 95,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 5500,
            contributorTwoBalance: 12000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 18750,
            bountyBalance: 3750
        });

        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(7.5));
    });

    it('should apply third tier discount', async function() {

        await testConfig.preSale.sendTransaction({
            value: testConfig.thirdTierDiscountUpperLimitEther,
            from: testConfig.contributorTwoAddress
        });

        assertions.ether({
            etherEscrowBalance: 17.5,
            presaleBalance: 0,
            contributorOneBalance: 97.5,
            contributorTwoBalance: 85,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 5500,
            contributorTwoBalance: 38000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 43750,
            bountyBalance: 8750
        });

        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(17.5));
    });
});