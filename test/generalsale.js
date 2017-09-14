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
        const contributionValue = web3.toWei(25);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
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
            contributorOneBalance: 50000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 12500
        });
    });    

    it('should allow contribution with affiliate data', async function() {
        const contributionValue = web3.toWei(25);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorOneAddress,
            data: testConfig.contributorTwoAddress
        });

        assertions.ether({
            etherEscrowBalance: 50,
            presaleBalance: 0,
            contributorOneBalance: 50,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });

        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 100500,
            contributorTwoBalance: 2500,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 125000,
            bountyBalance: 25000
        });
    });   
    it('should not allow contribution with too much gas', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei(110/testConfig.etherPeggedValue);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress,
                gas: 50000000001
            });
        });
    });
});