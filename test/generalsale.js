const assertFail = require("./helpers/assertFail");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");
const assertions = require("./helpers/assertions");

contract("General Sale",function(accounts){

    before(async function(){
        await testConfig.setUpForGeneralSale(accounts);
    });
    it('should initialize contract with expected values', async function() {
        const minContribution = await testConfig.generalSale.minContributionInWei();
        await assertions.expectedInitialisationGeneral(
            testConfig.generalSale, 
            {
                etherEscrowWallet: testConfig.etherEscrowWallet,
                reserveWallet: testConfig.reserveWallet,
                foundersWallet: testConfig.foundersWallet
            },
            {
                minContributionInWei: minContribution
            }
        );
    });

    it('should allow owner to resume the sale', async function(){
        await testConfig.generalSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const generalPaused = await testConfig.generalSale.paused();
        assert.equal(false, generalPaused);
    });

    it('should whitelist an affiliate', async function() {
        await testConfig.affiliateUtility.addAffiliate(testConfig.contributorTwoAddress, testConfig.contributorTwoAddress);
        const affiliate = await testConfig.affiliateUtility.getAffiliate.call(testConfig.contributorTwoAddress, {
            from: testConfig.ownerAddress
        });
        assert.equal(affiliate, testConfig.contributorTwoAddress);
    });

    it('should not allow contribution bellow the minimum amount', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei(80/testConfig.etherPeggedValue);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should allow contribution above the minimum amount without affiliate data', async function() {
        let contributionValue = web3.toWei(2);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 2,
            presaleBalance: 0,
            contributorOneBalance: 98,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 4000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 5000,
            bountyBalance: 1000
        });
    });

    it('should not allow contribution above the maximum amount', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei(1001/testConfig.etherPeggedValue);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should allow owner to pause the sale', async function(){
        await testConfig.generalSale.pauseContribution({
            from: testConfig.ownerAddress
        });
        const generalPaused = await testConfig.generalSale.paused();
        assert.equal(true, generalPaused);
    });

    it('should not allow contributions whilst paused', async function() {
        const contributionValue = web3.toWei(2);
        await assertFail(async function() {
            await testConfig.generalSale.sendTransaction({
                value: contributionValue,
                from: testConfig.contributorOneAddress
            });
        });
        assertions.ether({
            etherEscrowBalance: 2,
            presaleBalance: 0,
            contributorOneBalance: 98,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 4000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 5000,
            bountyBalance: 1000
        });
        const totalEtherPaid = await testConfig.generalSale.totalEtherPaid.call();
        assert.equal(totalEtherPaid.toNumber(), web3.toWei(2));
    });

    it('should allow owner to resume sale', async function() {
        await testConfig.generalSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const generalPaused = await testConfig.generalSale.paused();
        assert.equal(false, generalPaused);
    });

    it('should allow contribution with affiliate data', async function() {
        const contributionValue = web3.toWei(2);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorOneAddress,
            data: testConfig.contributorTwoAddress
        });
        assertions.ether({
            etherEscrowBalance: 4,
            presaleBalance: 0,
            contributorOneBalance: 96,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 8040,
            contributorTwoBalance: 120,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 10000,
            bountyBalance: 2000
        });
        const totalEtherPaid = await testConfig.generalSale.totalEtherPaid.call();
        assert.equal(totalEtherPaid.toNumber(), web3.toWei(4));
    });

    it('should allow smaller contribution when exceeds remaining and refund excess', async function() {
        const contributionValue = web3.toWei(2);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorOneAddress,
            data: testConfig.contributorTwoAddress
        });
        assertions.ether({
            etherEscrowBalance: 5,
            presaleBalance: 0,
            contributorOneBalance: 95,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 10060,
            contributorTwoBalance: 180,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 12500,
            bountyBalance: 2500
        });
    });

    it('should reject transaction when cap is breached', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei(1);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should allow owner to manually close the sale', async function() {
        await testConfig.generalSale.closeSale({
            from: testConfig.ownerAddress
        });
        const closed = await testConfig.generalSale.closed.call();
        assert.equal(true, closed);
    });

    it('should not allow contributions after closed', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei(1);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should allow transfer of ownership', async function() {
        await testConfig.generalSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
            from: testConfig.ownerAddress
        });
        await testConfig.shpController.setContracts(testConfig.shp.address, testConfig.trusteeWallet.address);
        let controller = await testConfig.shp.controller();
        let owner = await testConfig.trusteeWallet.owner();
        assert.equal(owner, testConfig.shpController.address);
        assert.equal(controller, testConfig.shpController.address);
    });
});