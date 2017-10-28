const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");
const time = require("./helpers/time");

contract("Presale move tokens", function(accounts) {

    before(async function() {
        await testConfig.setupForPreSale(accounts, false , 75);
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
            from: testConfig.ownerAddress
        });
        await testConfig.preSale.approveAddress(testConfig.contributorTwoAddress, {
            from: testConfig.ownerAddress
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

    it('should set the cap and contribute some Ether', async function() {

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

    it('should not be able to transfer ownership when sale is open', async function() {
        await assertFail(async function() {
            await testConfig.preSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
                from: testConfig.ownerAddress
            });
        });
        let controller = await testConfig.shp.controller();
        let owner = await testConfig.trusteeWallet.owner();
        assert.equal(owner, testConfig.preSale.address);
        assert.equal(controller, testConfig.preSale.address);
    });

    it('should manually close the sale', async function() {
        await testConfig.preSale.closeSale({
            from: testConfig.ownerAddress
        });
        const closed = await testConfig.preSale.closed();
        assert.equal(true, closed);
    });

    it('should not be able to transfer ownership when not owner', async function() {
        await assertFail(async function() {
            await testConfig.preSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
                from: testConfig.contributorTwoAddress
            });
        });
        let controller = await testConfig.shp.controller();
        let owner = await testConfig.trusteeWallet.owner();
        assert.equal(owner, testConfig.preSale.address);
        assert.equal(controller, testConfig.preSale.address);
    });

    it('should not be able to transfer SHP', async function() {
        await assertFail(async function() {
            await testConfig.shp.transfer(testConfig.contributorOneAddress, 50, {
                from: testConfig.contributorTwoAddress
            });
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

    it('should not be able to approve SHP transfers', async function() {
        let contribution = web3.toWei(50);
        await assertFail(async function() {
            await testConfig.shp.approve(testConfig.contributorOneAddress, contribution, {
                from: testConfig.contributorTwoAddress
            });
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

    it('should not accept Ether payments to SHP before transfer', async function() {
        let contribution = web3.toWei('1', 'ether');
        await assertFail(async function() {
            await testConfig.shp.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
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

    it('should not allow transfering ownership to zero address', async function() {
        await assertFail(async function() { 
            await testConfig.preSale.transferOwnership(testConfig.shpController.address, 0x0, {
                from: testConfig.ownerAddress
            });
        });
        await assertFail(async function() { 
            await testConfig.preSale.transferOwnership(0x0, testConfig.shpController.address, {
                from: testConfig.ownerAddress
            });
        });

        let controller = await testConfig.shp.controller();
        let owner = await testConfig.trusteeWallet.owner();
        assert.equal(owner, testConfig.preSale.address);
        assert.equal(controller, testConfig.preSale.address);

    });

    it('should transfer ownership to SHPController', async function() {
        await testConfig.preSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
            from: testConfig.ownerAddress
        });
        await testConfig.shpController.setContracts(testConfig.shp.address, testConfig.trusteeWallet.address);
        let controller = await testConfig.shp.controller();
        let owner = await testConfig.trusteeWallet.owner();
        assert.equal(owner, testConfig.shpController.address);
        assert.equal(controller, testConfig.shpController.address);
    });

    it('should not accept Ether payments to SHP after transfer', async function() {
        let contribution = web3.toWei('1', 'ether');
        await assertFail(async function() {
            await testConfig.shp.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
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

    it('should not accept Ether payments to SHPController', async function() {
        let contribution = web3.toWei('1', 'ether');
        await assertFail(async function() {
            await testConfig.shpController.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should be able to approve SHP transfers', async function() {
        let contribution = web3.toWei(50);
        await testConfig.shp.approve(testConfig.contributorOneAddress, contribution, {
            from: testConfig.contributorTwoAddress
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

    it('should not be able to set token counts when not owner', async function() {
        let founderTokenCount = await testConfig.preSale.founderTokenCount();
        let reserveTokenCount = await testConfig.preSale.reserveTokenCount();
        await assertFail(async function() {
            await testConfig.shpController.setTokenCounts(reserveTokenCount, founderTokenCount, {
                from: testConfig.contributorTwoAddress
            });
        });
        founderTokenCount = await testConfig.shpController.foundersTokens();
        reserveTokenCount = await testConfig.shpController.reserveTokens();
        assert.equal(web3.fromWei(founderTokenCount).toNumber(), 0);
        assert.equal(web3.fromWei(reserveTokenCount).toNumber(), 0);
    });

    it('should set token counts', async function() {
        let founderTokenCount = await testConfig.preSale.founderTokenCount();
        let reserveTokenCount = await testConfig.preSale.reserveTokenCount();
        await testConfig.shpController.setTokenCounts(reserveTokenCount, founderTokenCount, {
            from: testConfig.ownerAddress
        });
        founderTokenCount = await testConfig.shpController.foundersTokens();
        reserveTokenCount = await testConfig.shpController.reserveTokens();
        assert.equal(web3.fromWei(founderTokenCount).toNumber(), 25000);
        assert.equal(web3.fromWei(reserveTokenCount).toNumber(), 37500);
    });

    it('should not be able to set token counts once already set', async function() {
        let founderTokenCount = await testConfig.preSale.founderTokenCount();
        let reserveTokenCount = await testConfig.preSale.reserveTokenCount();
        await assertFail(async function() {
            await testConfig.shpController.setTokenCounts(reserveTokenCount, founderTokenCount, {
                from: testConfig.ownerAddress
            });
        });
        founderTokenCount = await testConfig.shpController.foundersTokens();
        reserveTokenCount = await testConfig.shpController.reserveTokens();
        assert.equal(web3.fromWei(founderTokenCount).toNumber(), 25000);
        assert.equal(web3.fromWei(reserveTokenCount).toNumber(), 37500);
    });

    it('should not be able to create vesting grants when not owner', async function() {
        await assertFail(async function() {
            await testConfig.shpController.createVestingGrants({
                from: testConfig.contributorOneAddress
            });
        });
        let grantsCreated = await testConfig.shpController.grantsCreated();
        assert.equal(grantsCreated, false);
    });

    it('should create vesting grants', async function() {
        await testConfig.shpController.createVestingGrants({
            from: testConfig.ownerAddress
        });
        let grantsCreated = await testConfig.shpController.grantsCreated();
        assert.equal(grantsCreated, true);
    });

    it('should not be able to create vesting grants twice', async function() {
        await assertFail(async function() {
            await testConfig.shpController.createVestingGrants({
                from: testConfig.ownerAddress
            });
        });
        let grantsCreated = await testConfig.shpController.grantsCreated();
        assert.equal(grantsCreated, true);
    });

    it('should move SHP bounty tokens straightaway', async function() {

        let withdraw = web3.toWei(12500);
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
            contributorOneBalance: 12500,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 0
        });
    });

    it('should not be able to move SHP reserve tokens before cliff', async function() {

        let withdraw = web3.toWei(50);
        let data = await testConfig.shp.contract.transfer.getData(testConfig.contributorOneAddress, withdraw);

        await testConfig.reserveWallet.submitTransaction(
            testConfig.shp.address, 
            0, 
            data, 
            {
                from: testConfig.reserveSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 12500,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 0
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
            contributorOneBalance: 12500,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 0
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
            contributorOneBalance: 12500,
            contributorTwoBalance: 55000,
            foundersBalance: 0,
            reserveBalance: 10817,
            trusteeBalance: 51683,
            bountyBalance: 0
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
            contributorOneBalance: 12500,
            contributorTwoBalance: 55000,
            foundersBalance: 7212,
            reserveBalance: 10817,
            trusteeBalance: 44471,
            bountyBalance: 0
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
            contributorOneBalance: 12500,
            contributorTwoBalance: 55000,
            reserveBalance: 37500,
            foundersBalance: 7212,
            trusteeBalance: 17788,
            bountyBalance: 0
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
            contributorOneBalance: 12500,
            contributorTwoBalance: 55000,
            foundersBalance: 25000,
            reserveBalance: 37500,
            trusteeBalance: 0,
            bountyBalance: 0
        });
    });
});