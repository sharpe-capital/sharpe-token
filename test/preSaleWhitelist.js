const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("Presale whitelist", function(accounts) {

    before(async function() {
        await testConfig.setupForPreSale(accounts, false, 75);
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

    it('should register permitted addresses', async function(){
        await testConfig.preSale.approveAddress(testConfig.contributorOneAddress, {
            from: testConfig.apiAddress
        });
        await testConfig.preSale.approveAddress(testConfig.contributorTwoAddress, {
            from: testConfig.apiAddress
        });
        const approvedOne = await testConfig.preSale.approvedAddresses.call(testConfig.contributorOneAddress);
        assert.equal(true, approvedOne);
        const approvedTwo = await testConfig.preSale.approvedAddresses.call(testConfig.contributorTwoAddress);
        assert.equal(true, approvedTwo);
    });

    it('should allow owner to resume the sale', async function(){
        await testConfig.preSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should allow valid contribution from not whitelisted contributor if below cap', async function() {

        let contribution = web3.toWei('25', 'ether');
        await testConfig.preSale.sendTransaction({
            value: contribution,
            from: testConfig.contributorTwoAddress
        });
    
        assertions.ether({
            etherEscrowBalance: 25,
            presaleBalance: 0,
            contributorOneBalance: 100,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 12500
        });
    
        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(25));
    
        let preSaleCap = (await testConfig.preSale.preSaleCap()).toNumber();
        assert.equal(preSaleCap, web3.toWei(75));
    });

    it('should allow contributions from whitelisted contributor equal to planned amount', async function() {
        let plannedContribution = web3.toWei('25', 'ether');
        await testConfig.preSale.addToWhitelist(
            testConfig.contributorTwoAddress,
            plannedContribution,
            {
                from: testConfig.ownerAddress
            }
        );

        await testConfig.preSale.sendTransaction({
            value: plannedContribution,
            from: testConfig.contributorTwoAddress
        });
       
        assertions.ether({
            etherEscrowBalance: 50,
            presaleBalance: 0,
            contributorOneBalance: 100,
            contributorTwoBalance: 50,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 110000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 125000,
            bountyBalance: 25000
        });
        
        preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(50));
    });

    it('should allow contributions from whitelisted contributor and allow excess if there is cap available', async function() {
        let plannedContribution = web3.toWei('20', 'ether');
        await testConfig.preSale.addToWhitelist(
            testConfig.contributorOneAddress,
            plannedContribution,
            {
                from: testConfig.ownerAddress
            }
        );

        let excessContribution = web3.toWei('25', 'ether');
        await testConfig.preSale.sendTransaction({
            value: excessContribution,
            from: testConfig.contributorOneAddress
        });
       
        assertions.ether({
            etherEscrowBalance: 75,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 50,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 110000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 187500,
            bountyBalance: 37500
        });

        preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(75));
    });

    it('should not allow contributions from not whitelisted contributor if cap is 0', async function() {

        let contribution = web3.toWei('25', 'ether');
        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: contribution,
                from: testConfig.bountySignAddress
            });
        });

        assertions.ether({
            etherEscrowBalance: 75,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 50,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 110000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 187500,
            bountyBalance: 37500
        });

        preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(75));
    });

});
