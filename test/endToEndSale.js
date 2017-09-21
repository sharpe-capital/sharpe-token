const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("End-to-end process for pre-sale, crowdsale & vesting", function(accounts) {

    const hashes = [];
    const ceilings = [];

    before(async function() {
        await testConfig.setupForPreSale(accounts);
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

    it('should whitelist a contributor', async function() {
        let plannedContribution = web3.toWei('50', 'ether');
        await testConfig.preSale.addToWhitelist(
            testConfig.contributorTwoAddress,
            plannedContribution, {
                from: testConfig.ownerAddress
            }
        );
        let whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
        assert.equal(whitelistedPlannedContributions, web3.toWei(50));
    });

    it('should enable contributions', async function() {
        await testConfig.preSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should accept whitelisted contribution', async function() {

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

        let whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
        assert.equal(whitelistedPlannedContributions, web3.toWei(25));
    });

    it('should accept non-whitelisted contribution', async function() {

        let contribution = web3.toWei('50', 'ether');
        await testConfig.preSale.sendTransaction({
            value: contribution,
            from: testConfig.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 75,
            presaleBalance: 0,
            contributorOneBalance: 50,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 110000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 187500,
            bountyBalance: 37500
        });

        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(75));

        let whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
        assert.equal(whitelistedPlannedContributions, web3.toWei(25));
    });

    it('should close the sale manually below the cap', async function() {
        await testConfig.preSale.closeSale({
            from: testConfig.ownerAddress
        });
        const closed = await testConfig.preSale.closed();
        assert.equal(true, closed);
    });

    it('should deploy the general sale', async function() {
        await testConfig.setUpForGeneralSale(accounts);
        const minContribution = await testConfig.generalSale.minContributionInWei();
        await assertions.expectedInitialisationGeneral(testConfig.generalSale, {
            etherEscrowWallet: testConfig.etherEscrowWallet,
            reserveWallet: testConfig.reserveWallet,
            foundersWallet: testConfig.foundersWallet
        }, {
            minContributionInWei: minContribution
        });
    });

    it('should transfer ownership to the general sale', async function() {
        await testConfig.preSale.transferOwnership(testConfig.generalSale.address, testConfig.generalSale.address, {
            from: testConfig.ownerAddress
        });
        await testConfig.generalSale.setShp(testConfig.shp.address);
        let controller = await testConfig.shp.controller();
        let owner = await testConfig.trusteeWallet.owner();
        assert.equal(owner, testConfig.generalSale.address);
        assert.equal(controller, testConfig.generalSale.address);
    });

    it('should set the hidden dynamic ceilings', async function() {
        const minContribution = await testConfig.generalSale.minContributionInWei();
        ceilings.push([web3.toWei(5), 1, minContribution]);
        ceilings.push([web3.toWei(7), 1, minContribution]);
        let i = 0;
        for (let c of ceilings) {
            const h = await testConfig.dynamicCeiling.calculateHash(
                c[0],
                c[1],
                c[2],
                i === ceilings.length - 1,
                web3.sha3(`pwd${i}`));
            hashes.push(h);
            i += 1;
        }
        // add some more random hashes to conceal the total number of ceilings
        for (; i < 10; i += 1) {
            hashes.push(web3.sha3(`pwd${i}`));
        }
        await testConfig.dynamicCeiling.setHiddenCeilings(hashes);
        assert.equal(await testConfig.dynamicCeiling.nCeilings(), 10);
    });

    it('should reveal the first ceiling', async function() {
        await testConfig.dynamicCeiling.revealCeiling(
            ceilings[0][0],
            ceilings[0][1],
            ceilings[0][2],
            false,
            web3.sha3("pwd0"));

        assert.equal(await testConfig.dynamicCeiling.revealedCeilings(), 1);
        assert.equal((await testConfig.dynamicCeiling.currentIndex()).toFixed(), '0');
        assert.equal(await testConfig.dynamicCeiling.allRevealed(), false);
    });

    it('should enable contributions', async function() {
        await testConfig.generalSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.generalSale.paused();
        assert.equal(false, paused);
    });

    it('should accept a contribution', async function() {

        let contribution = web3.toWei('1', 'ether');
        await testConfig.generalSale.sendTransaction({
            value: contribution,
            from: testConfig.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 76,
            presaleBalance: 0,
            contributorOneBalance: 49,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 112000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 190000,
            bountyBalance: 38000
        });

        let totalEtherPaid = (await testConfig.generalSale.totalEtherPaid()).toNumber();
        assert.equal(totalEtherPaid, web3.toWei(1));
        assert.equal(await testConfig.dynamicCeiling.revealedCeilings(), 1);
    });

    it('should move to the next ceiling', async function() {});
    it('should accept a smaller contribution at next ceiling', async function() {});
    it('should manually close the sale', async function() {});
    it('should transfer ownership to the SHP controller', async function() {});
    it('should move bounty tokens immediately after the sale closes', async function() {});
    it('should create the vesting grants', async function() {});
    it('should exercise the grant after the cliff', async function() {});
    it('should exercise the full grant when vesting is complete', async function() {});
});