const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("Presale initialization and permissions", function(accounts) {

    before(async function() {
        await testConfig.setup(accounts);
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

    it('should not allow pausing if not owner', async function() {
        await assertFail(async function() {
            await testConfig.preSale.pauseContribution({
                from: testConfig.contributorTwoAddress
            });
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should allow pausing when owner', async function() {
        await testConfig.preSale.pauseContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(true, paused);
    });

    it('should not allow contributions whilst paused', async function() {
        let contribution = web3.toWei('1', 'ether');
        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: contribution,
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
    });

    it('should not allow resuming if not owner', async function() {
        await assertFail(async function() {
            await testConfig.preSale.resumeContribution({
                from: testConfig.contributorTwoAddress
            });
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(true, paused);
    });

    it('should allow resuming when owner', async function() {
        await testConfig.preSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should allow contribution whilst pre-sale is open', async function() {
        let contribution = web3.toWei('25', 'ether');
        await testConfig.preSale.sendTransaction({
            value: contribution,
            from: testConfig.contributorTwoAddress
        })
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
    });

    it('should not allow closing if not owner', async function() {
        await assertFail(async function() {
            await testConfig.preSale.closeSale({
                from: testConfig.contributorTwoAddress
            });
        });
        const closed = await testConfig.preSale.closed();
        assert.equal(false, closed);
    });
    
    it('should not be able to transfer ownership if pre-sale is open', async function() {
        await assertFail(async function() {
            await testConfig.preSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
                from: testConfig.ownerAddress
            });
        });
    });
    
    it('should allow closing when owner', async function() {
        await testConfig.preSale.closeSale({
            from: testConfig.ownerAddress
        });
        const closed = await testConfig.preSale.closed();
        assert.equal(true, closed);
    });

    it('should not allow contributions after the crowdsale is closed', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei('25', 'ether');
            await testConfig.preSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorTwoAddress
            });
        });
    });
    
    it('should not be able to transfer ownership if not owner', async function() {
        await assertFail(async function() {
            await testConfig.preSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
                from: testConfig.contributorTwoAddress
            });
        });
    });
    
    it('should transfer ownership if owner and pre-sale is closed', async function() {
        await testConfig.preSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
            from: testConfig.ownerAddress
        });
    });
});