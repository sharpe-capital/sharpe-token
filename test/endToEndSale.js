const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");
const time = require("./helpers/time");

contract("End-to-end process for pre-sale, crowdsale & vesting", function(accounts) {

    const hashes = [];
    const ceilings = [];

    before(async function() {
        await testConfig.setupForPreSale(accounts);
    });

    it('should initialize Presale contract with expected values', async function() {
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

    it('should check both presale is still paused', async function() {
        const paused = await testConfig.preSale.paused();
        assert.equal(true, paused);
    });

    it('should enable PreSale contributions', async function() {
        await testConfig.preSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should not accept contribution before permitted', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei('25', 'ether');
            await testConfig.preSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorTwoAddress
            });
        });
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

    // it('should accept non-whitelisted contribution', async function() {

    //     let contribution = web3.toWei('50', 'ether');
    //     await testConfig.preSale.sendTransaction({
    //         value: contribution,
    //         from: testConfig.contributorOneAddress
    //     });
    //     assertions.ether({
    //         etherEscrowBalance: 75,
    //         presaleBalance: 0,
    //         contributorOneBalance: 50,
    //         contributorTwoBalance: 75,
    //         reserveBalance: 0,
    //         foundersBalance: 0
    //     });
    //     await assertions.SHP({
    //         etherEscrowBalance: 0,
    //         presaleBalance: 0,
    //         contributorOneBalance: 110000,
    //         contributorTwoBalance: 55000,
    //         reserveBalance: 0,
    //         foundersBalance: 0,
    //         trusteeBalance: 187500,
    //         bountyBalance: 37500
    //     });

    //     let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
    //     assert.equal(preSaleEtherPaid, web3.toWei(75));

    //     let whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
    //     assert.equal(whitelistedPlannedContributions, web3.toWei(25));
    // });

    it('should close the sale manually below the cap', async function() {
        await testConfig.preSale.closeSale({
            from: testConfig.ownerAddress
        });
        const closed = await testConfig.preSale.closed();
        assert.equal(true, closed);
    });

    it('should initialize General Sale contract with expected values', async function() {
        await testConfig.setUpForGeneralSale(accounts);
        const minContribution = await testConfig.generalSale.minContributionInWei();
        await assertions.expectedInitialisationGeneral(
            testConfig.generalSale, {
                etherEscrowWallet: testConfig.etherEscrowWallet,
                reserveWallet: testConfig.reserveWallet,
                foundersWallet: testConfig.foundersWallet
            }, {
                minContributionInWei: minContribution
            }
        );
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

    it('should register permitted addresses', async function(){
        await testConfig.generalSale.approveAddress(testConfig.contributorOneAddress, {
            from: testConfig.apiAddress
        });
        await testConfig.generalSale.approveAddress(testConfig.contributorTwoAddress, {
            from: testConfig.apiAddress
        });
        const approvedOne = await testConfig.generalSale.approvedAddresses.call(testConfig.contributorOneAddress);
        assert.equal(true, approvedOne);
        const approvedTwo = await testConfig.generalSale.approvedAddresses.call(testConfig.contributorTwoAddress);
        assert.equal(true, approvedTwo);
    });

    it('should set the hidden dynamic ceilings', async function() {
        const minContribution = await testConfig.generalSale.minContributionInWei();
        ceilings.push([web3.toWei(2), 1, minContribution]);
        ceilings.push([web3.toWei(4), 1, minContribution]);
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

    it('should enable contributions', async function() {
        await testConfig.generalSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.generalSale.paused();
        assert.equal(false, paused);
    });

    it('should not allow contributions when no ceiliengs have been revealed', async function() {
        const contributionValue = web3.toWei(2);
        await assertFail(async function() {
            await testConfig.generalSale.sendTransaction({
                value: contributionValue,
                from: testConfig.contributorOneAddress
            });
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
        const totalEtherPaid = await testConfig.generalSale.totalEtherPaid.call();
        assert.equal(totalEtherPaid.toNumber(), web3.toWei(0));
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

    it('should accept a contribution', async function() {

        let contribution = web3.toWei('2', 'ether');
        await testConfig.generalSale.sendTransaction({
            value: contribution,
            from: testConfig.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 27,
            presaleBalance: 0,
            contributorOneBalance: 98,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 4000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 67500,
            bountyBalance: 13500
        });

        let totalEtherPaid = (await testConfig.generalSale.totalEtherPaid()).toNumber();
        assert.equal(totalEtherPaid, web3.toWei(2));
        assert.equal(await testConfig.dynamicCeiling.revealedCeilings(), 1);
    });
    
    it('should not accept contribution when ceiling cap is reached', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei(1);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should move to the next ceiling', async function() {
        await testConfig.dynamicCeiling.revealCeiling(
            ceilings[1][0],
            ceilings[1][1],
            ceilings[1][2],
            true,
            web3.sha3("pwd1"));

        assert.equal(await testConfig.dynamicCeiling.revealedCeilings(), 2);
        assert.equal((await testConfig.dynamicCeiling.currentIndex()).toFixed(), '0');
        assert.equal(await testConfig.dynamicCeiling.allRevealed(), true);
    });

    it('should accept a smaller contribution at next ceiling', async function() {

        let contribution = web3.toWei('1', 'ether');
        await testConfig.generalSale.sendTransaction({
            value: contribution,
            from: testConfig.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 28,
            presaleBalance: 0,
            contributorOneBalance: 97,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 6000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 70000,
            bountyBalance: 14000
        });

        let totalEtherPaid = (await testConfig.generalSale.totalEtherPaid()).toNumber();
        assert.equal(totalEtherPaid, web3.toWei(3));
        assert.equal(await testConfig.dynamicCeiling.revealedCeilings(), 2);
    });
    it('should manually close the sale', async function() {
        await testConfig.generalSale.closeSale({
            from: testConfig.ownerAddress
        });
        const closed = await testConfig.preSale.closed();
        assert.equal(true, closed);
    });
    it('should transfer ownership to the SHP controller', async function() {
        await testConfig.generalSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
            from: testConfig.ownerAddress
        });
        let controller = await testConfig.shp.controller();
        let owner = await testConfig.trusteeWallet.owner();
        assert.equal(owner, testConfig.shpController.address);
        assert.equal(controller, testConfig.shpController.address);
    });

    it('should set token counts', async function() {
        let founderTokenCount = web3.toWei(23333);
        let reserveTokenCount = web3.toWei(46666);
        await testConfig.shpController.setTokenCounts(reserveTokenCount, founderTokenCount, {
            from: testConfig.ownerAddress
        });
        founderTokenCount = await testConfig.shpController.foundersTokens();
        reserveTokenCount = await testConfig.shpController.reserveTokens();
        assert.equal(founderTokenCount.toNumber(), web3.toWei(23333));
        assert.equal(reserveTokenCount.toNumber(), web3.toWei(46666));
    });

    it('should create the vesting grants', async function() {
        await testConfig.shpController.createVestingGrants({
            from: testConfig.ownerAddress
        });
        let grantsCreated = await testConfig.shpController.grantsCreated();
        assert.equal(grantsCreated, true);
    });

    it('should move bounty tokens immediately after the sale closes', async function() {
        let withdraw = web3.toWei(39000);
        let data = await testConfig.shp.contract.transfer.getData(testConfig.contributorOneAddress, withdraw);

        await testConfig.bountyWallet.submitTransaction(
            testConfig.shp.address, 
            0, 
            data, 
            {
                from: testConfig.bountySignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 6000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 70000,
            bountyBalance: 14000
        });
    });
    
    it('should not be able to move SHP founders tokens before cliff', async function() {

        let withdraw = web3.toWei(50);
        let data = await testConfig.shp.contract.transfer.getData(testConfig.contributorOneAddress, withdraw);

        await testConfig.foundersWallet.submitTransaction(
            testConfig.shp.address, 
            0, 
            data, 
            {
                from: testConfig.foundersSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 6000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 70000,
            bountyBalance: 14000
        });
    });

    it('should move some SHP reserve tokens after cliff', async function() {
        const sevenMonths = (60 * 60 * 24 * 30) * 7;
        await time.increaseTime(sevenMonths);

        let data = await testConfig.trusteeWallet.contract.unlockVestedTokens.getData();  
        
        await testConfig.reserveWallet.submitTransaction(
            testConfig.trusteeWallet.address, 
            0, 
            data, 
            {
                from: testConfig.reserveSignAddress
            }
        );
        
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 6000,
            contributorTwoBalance: 55000,
            foundersBalance: 0,
            reserveBalance: 13461,
            trusteeBalance: 70000 - 13461,
            bountyBalance: 14000
        });
    });
     it('should move some SHP founders tokens after cliff', async function() {

        let data = await testConfig.trusteeWallet.contract.unlockVestedTokens.getData();
        
        await testConfig.foundersWallet.submitTransaction(
            testConfig.trusteeWallet.address, 
            0, 
            data, 
            {
                from: testConfig.foundersSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 6000,
            contributorTwoBalance: 55000,
            foundersBalance: 6731,
            reserveBalance: 13461,
            trusteeBalance: 70000 - 13461 - 6731,
            bountyBalance: 14000
        });
    });

    it('should move all SHP reserve tokens when fully vested', async function() {

        const eighteenMonths = (60 * 60 * 24 * 30) * 18;
        await time.increaseTime(eighteenMonths);

        let data = await testConfig.trusteeWallet.contract.unlockVestedTokens.getData();
        
        await testConfig.reserveWallet.submitTransaction(
            testConfig.trusteeWallet.address, 
            0, 
            data, 
            {
                from: testConfig.reserveSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 6000,
            contributorTwoBalance: 55000,
            foundersBalance: 6731,
            reserveBalance: 46666,
            trusteeBalance: 70000 - 46666 - 6731,
            bountyBalance: 14000
        });
    });

    it('should move all SHP founders tokens when fully vested', async function() {

        let data = await testConfig.trusteeWallet.contract.unlockVestedTokens.getData();
        
        await testConfig.foundersWallet.submitTransaction(
            testConfig.trusteeWallet.address, 
            0, 
            data, 
            {
                from: testConfig.foundersSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 6000,
            contributorTwoBalance: 55000,
            foundersBalance: 23333,
            reserveBalance: 46666,
            trusteeBalance: 1,
            bountyBalance: 14000
        });
    });
});