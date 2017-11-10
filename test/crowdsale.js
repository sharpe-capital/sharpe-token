const assertFail = require("./helpers/assertFail");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");
const assertions = require("./helpers/assertions");
const time = require("./helpers/time");

const SharpeCrowdsale = artifacts.require("SharpeCrowdsale");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const SHP = artifacts.require("SHP");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const Trustee = artifacts.require("Trustee");
const SHPController = artifacts.require("SHPController");

contract("Crowdsale", function(accounts) {

    before(async function() {

        console.log('Logging out all of the accounts for reference...');
        accounts.forEach(acc => console.log(acc + ' -> ' + web3.fromWei(web3.eth.getBalance(acc).toNumber())));
        this.etherPeggedValue = 300;
        this.contributorOneAddress = accounts[1];
        this.contributorTwoAddress = accounts[2];
        this.escrowSignAddress = accounts[3];
        this.reserveSignAddress = accounts[4];
        this.foundersSignAddress = accounts[5];
        this.masterAddress = accounts[6];
        this.bountySignAddress = accounts[7];
        this.apiAddress = accounts[7];

        this.miniMeTokenFactory = await MiniMeTokenFactory.new();
        this.ownerAddress = accounts[0];

        this.shp = await SHP.new(this.miniMeTokenFactory.address);

        this.etherEscrowWallet = await MultiSigWallet.new([this.escrowSignAddress], 1);
        this.bountyWallet = await MultiSigWallet.new([this.bountySignAddress], 1);
        this.foundersWallet = await MultiSigWallet.new([this.foundersSignAddress], 1);
        this.reserveWallet = await MultiSigWallet.new([this.reserveSignAddress], 1);
        this.trusteeWallet = await Trustee.new(this.shp.address);

        this.etherEscrowAddress = this.etherEscrowWallet.address;
        this.foundersAddress = this.foundersWallet.address;
        this.reserveAddress = this.reserveWallet.address;
        this.bountyAddress = this.bountyWallet.address;
        this.trusteeAddress = this.trusteeWallet.address;

        this.minDiscount = web3.toWei(10);
        this.firstTierDiscountUpperLimit = web3.toWei(20);
        this.secondTierDiscountUpperLimit = web3.toWei(30);
        this.thirdTierDiscountUpperLimit = web3.toWei(40);
        this.minContribution = web3.toWei(5);
        this.maxContribution = web3.toWei(45);

        this.shpController = await SHPController.new(
            this.reserveAddress,
            this.foundersAddress
        );

        await this.shpController.setContracts(this.shp.address, this.trusteeAddress);

        console.log("ownerAddress: " + this.ownerAddress);
        console.log("contributorOneAddress: " + this.contributorOneAddress);
        console.log("contributorTwoAddress: " + this.contributorTwoAddress);

        this.sharpeCrowdsale = await SharpeCrowdsale.new(
            this.etherEscrowWallet.address,
            this.bountyWallet.address,
            this.trusteeWallet.address,
            this.minDiscount,
            this.firstTierDiscountUpperLimit,
            this.secondTierDiscountUpperLimit,
            this.thirdTierDiscountUpperLimit,
            this.minContribution,
            this.maxContribution,
            5000
        );

        await this.trusteeWallet.changeOwner(this.sharpeCrowdsale.address);
        await this.shp.changeController(this.sharpeCrowdsale.address);
        await this.sharpeCrowdsale.setShp(this.shp.address);

        assertions.initialize(
            this.etherEscrowAddress,
            this.sharpeCrowdsale.address,
            this.contributorOneAddress,
            this.contributorTwoAddress,
            this.reserveAddress,
            this.foundersAddress,
            this.trusteeAddress,
            this.bountyAddress,
            this.masterAddress,
            this.shp);
    });

    it('should initialize contract with expected values', async function() {
        assert.equal(await this.sharpeCrowdsale.minPresaleContributionEther(), this.minContribution);
        assert.equal(await this.sharpeCrowdsale.maxPresaleContributionEther(), this.maxContribution);
        assert.equal(await this.sharpeCrowdsale.minDiscountEther(), this.minDiscount);
        assert.equal(await this.sharpeCrowdsale.firstTierDiscountUpperLimitEther(), this.firstTierDiscountUpperLimit);
        assert.equal(await this.sharpeCrowdsale.secondTierDiscountUpperLimitEther(), this.secondTierDiscountUpperLimit);
        assert.equal(await this.sharpeCrowdsale.thirdTierDiscountUpperLimitEther(), this.thirdTierDiscountUpperLimit);
        assert.equal(await this.sharpeCrowdsale.shpExchangeRate(), 5000);
        assert.equal(await this.sharpeCrowdsale.etherEscrowAddress(), this.etherEscrowAddress);
        assert.equal(await this.sharpeCrowdsale.bountyAddress(), this.bountyAddress);
        assert.equal(await this.sharpeCrowdsale.trusteeAddress(), this.trusteeAddress);
    });
    it('should resume contribution', async function() {
        await this.sharpeCrowdsale.resumeContribution({
            from: this.ownerAddress
        });
        const paused = await this.sharpeCrowdsale.paused();
        assert.equal(false, paused);
    });
    it('should process discount tier 1', async function() {

        let contribution = web3.toWei('11', 'ether');
        await this.sharpeCrowdsale.sendTransaction({
            value: contribution,
            from: this.contributorTwoAddress
        });
        assertions.ether({
            etherEscrowBalance: 11,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 100,
            contributorTwoBalance: 89,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 23100,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500,
            bountyBalance: 5500
        });

        let etherPaid = (await this.sharpeCrowdsale.etherPaid()).toNumber();
        assert.equal(etherPaid, web3.toWei(11));
    });
    it('should process discount tier 2', async function() {

        let contribution = web3.toWei('21', 'ether');
        await this.sharpeCrowdsale.sendTransaction({
            value: contribution,
            from: this.contributorTwoAddress
        });
        assertions.ether({
            etherEscrowBalance: 32,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 100,
            contributorTwoBalance: 68,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 23100 + 46200,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500,
            bountyBalance: 5500 + 10500
        });

        let etherPaid = (await this.sharpeCrowdsale.etherPaid()).toNumber();
        assert.equal(etherPaid, web3.toWei(32));
    });
    it('should process discount tier 3', async function() {

        let contribution = web3.toWei('31', 'ether');
        await this.sharpeCrowdsale.sendTransaction({
            value: contribution,
            from: this.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 63,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 69,
            contributorTwoBalance: 68,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400,
            contributorTwoBalance: 23100 + 46200,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500,
            bountyBalance: 5500 + 10500 + 15500
        });

        let etherPaid = (await this.sharpeCrowdsale.etherPaid()).toNumber();
        assert.equal(etherPaid, web3.toWei(63));
    });
    it('should process discount tier 4', async function() {

        let contribution = web3.toWei('41', 'ether');
        await this.sharpeCrowdsale.sendTransaction({
            value: contribution,
            from: this.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 104,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 28,
            contributorTwoBalance: 68,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600,
            contributorTwoBalance: 23100 + 46200,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500 + 102500,
            bountyBalance: 5500 + 10500 + 15500 + 20500
        });

        let etherPaid = (await this.sharpeCrowdsale.etherPaid()).toNumber();
        assert.equal(etherPaid, web3.toWei(104));
    });
    it('should process no discount', async function() {

        let contribution = web3.toWei('6', 'ether');
        await this.sharpeCrowdsale.sendTransaction({
            value: contribution,
            from: this.contributorTwoAddress
        });
        assertions.ether({
            etherEscrowBalance: 110,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 28,
            contributorTwoBalance: 62,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600,
            contributorTwoBalance: 23100 + 46200 + 12000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500 + 102500 + 15000,
            bountyBalance: 5500 + 10500 + 15500 + 20500 + 3000
        });

        let etherPaid = (await this.sharpeCrowdsale.etherPaid()).toNumber();
        assert.equal(etherPaid, web3.toWei(110));
    });
    it('should pause the sale', async function() {
        await this.sharpeCrowdsale.pauseContribution({
            from: this.ownerAddress
        });
        const paused = await this.sharpeCrowdsale.paused();
        assert.equal(true, paused);
    });
    it('should fail to send Ether when the sale is paused', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei('6', 'ether');
            await this.sharpeCrowdsale.sendTransaction({
                value: contribution,
                from: this.contributorTwoAddress
            });
        });
    });
    it('should resume the sale', async function() {
        await this.sharpeCrowdsale.resumeContribution({
            from: this.ownerAddress
        });
        const paused = await this.sharpeCrowdsale.paused();
        assert.equal(false, paused);
    });
    it('should fail to send Ether when amount is below min', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei('4', 'ether');
            await this.sharpeCrowdsale.sendTransaction({
                value: contribution,
                from: this.contributorTwoAddress
            });
        });
    });
    it('should fail to send Ether when amount is above max', async function() {
        await assertFail(async function() {
            let contribution = web3.toWei('50', 'ether');
            await this.sharpeCrowdsale.sendTransaction({
                value: contribution,
                from: this.contributorTwoAddress
            });
        });
    });
    it('should set the exchange rate', async function() {
        await this.sharpeCrowdsale.setShpExchangeRate(6000);
        const rate = await this.sharpeCrowdsale.shpExchangeRate();
        assert.equal(6000, rate);
    });
    it('should allow the owner to mint tokens', async function() {
        await this.sharpeCrowdsale.mintTokens(web3.toWei('2000', 'ether'), this.contributorTwoAddress);
        assertions.ether({
            etherEscrowBalance: 110,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 28,
            contributorTwoBalance: 62,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500 + 102500 + 15000,
            bountyBalance: 5500 + 10500 + 15500 + 20500 + 3000
        });
    });
    it('should peg the Ether values', async function() {
        this.minDiscount = web3.toWei(9);
        this.firstTierDiscountUpperLimit = web3.toWei(19);
        this.secondTierDiscountUpperLimit = web3.toWei(29);
        this.thirdTierDiscountUpperLimit = web3.toWei(49);
        this.minContribution = web3.toWei(4);
        this.maxContribution = web3.toWei(44);
        await this.sharpeCrowdsale.pegEtherValues(
            this.minDiscount,
            this.firstTierDiscountUpperLimit,
            this.secondTierDiscountUpperLimit,
            this.thirdTierDiscountUpperLimit,
            this.minContribution,
            this.maxContribution
        );
        assert.equal(await this.sharpeCrowdsale.minPresaleContributionEther(), this.minContribution);
        assert.equal(await this.sharpeCrowdsale.maxPresaleContributionEther(), this.maxContribution);
        assert.equal(await this.sharpeCrowdsale.minDiscountEther(), this.minDiscount);
        assert.equal(await this.sharpeCrowdsale.firstTierDiscountUpperLimitEther(), this.firstTierDiscountUpperLimit);
        assert.equal(await this.sharpeCrowdsale.secondTierDiscountUpperLimitEther(), this.secondTierDiscountUpperLimit);
        assert.equal(await this.sharpeCrowdsale.thirdTierDiscountUpperLimitEther(), this.thirdTierDiscountUpperLimit);
    });
    it('should fail to transfer tokens', async function() {
        await assertFail(async function() {
            await this.shp.transfer(this.contributorOneAddress, 50, {
                from: this.contributorTwoAddress
            });
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500 + 102500 + 15000,
            bountyBalance: 5500 + 10500 + 15500 + 20500 + 3000
        });
    });
    it('should set tokens to transferable', async function() {
        await this.sharpeCrowdsale.setAllowTransfer(true);
        const allowTransfer = await this.sharpeCrowdsale.allowTransfer();
        assert.equal(true, allowTransfer);
    });
    it('should allow token transfer', async function() {
        await this.shp.transfer(this.contributorOneAddress, web3.toWei(50), {
            from: this.contributorTwoAddress
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600 + 50,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000 - 50,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500 + 102500 + 15000,
            bountyBalance: 5500 + 10500 + 15500 + 20500 + 3000
        });
    });
    it('should fail to peg Ether values if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.pegEtherValues(
                this.minDiscount,
                this.firstTierDiscountUpperLimit,
                this.secondTierDiscountUpperLimit,
                this.thirdTierDiscountUpperLimit,
                this.minContribution,
                this.maxContribution,
                {
                    from: this.contributorTwoAddress
                }
            );
        });
    });
    it('should fail to mint tokens if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.mintTokens(web3.toWei('2000', 'ether'), this.contributorTwoAddress, {
                from: this.contributorTwoAddress
            });
        });
    });
    it('should fail to set SHP if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.setShp(this.shp.address, {
                from: this.contributorTwoAddress
            });
        });
    });
    it('should fail to transfer ownership if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.transferOwnership(this.shpController.address, this.shpController.address, {
                from: this.contributorTwoAddress
            });
        });
    });
    it('should fail to pause sale if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.pauseContribution({
                from: this.contributorTwoAddress
            });
        });
    });
    it('should fail to resume sale if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.resumeContribution({
                from: this.contributorTwoAddress
            });
        });
    });
    it('should fail to set exchange rate if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.setShpExchangeRate(6000, {
                from: this.contributorTwoAddress
            });
        });
    });
    it('should fail to set transferable if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.setAllowTransfer(true, {
                from: this.contributorTwoAddress
            });
        });
    });
    it('should fail to close sale if not owner', async function() {
        await assertFail(async function() {
            await this.sharpeCrowdsale.closeSale({
                from: this.contributorTwoAddress
            });
        });
    });
    it('should close the sale', async function() {
        await this.sharpeCrowdsale.closeSale({
            from: this.ownerAddress
        });
        const closed = await this.sharpeCrowdsale.closed();
        assert.equal(true, closed);
    });

    it('should transfer ownership to the SHP controller', async function() {
        await this.sharpeCrowdsale.transferOwnership(this.shpController.address, this.shpController.address, {
            from: this.ownerAddress
        });
        let controller = await this.shp.controller();
        let owner = await this.trusteeWallet.owner();
        assert.equal(owner, this.shpController.address);
        assert.equal(controller, this.shpController.address);
    });

    it('should set token counts', async function() {
        let founderTokenCount = await this.sharpeCrowdsale.founderTokenCount();
        let reserveTokenCount = await this.sharpeCrowdsale.reserveTokenCount();
        await this.shpController.setTokenCounts(reserveTokenCount, founderTokenCount, {
            from: this.ownerAddress
        });
        founderTokenCount = await this.shpController.foundersTokens();
        reserveTokenCount = await this.shpController.reserveTokens();
        assert.equal(founderTokenCount.toNumber(), founderTokenCount);
        assert.equal(reserveTokenCount.toNumber(), reserveTokenCount);
    });

    it('should create the vesting grants', async function() {
        await this.shpController.createVestingGrants({
            from: this.ownerAddress
        });
        let grantsCreated = await this.shpController.grantsCreated();
        assert.equal(grantsCreated, true);
    });

    it('should move bounty tokens immediately after the sale closes', async function() {
        let withdraw = web3.toWei(5500 + 10500 + 15500 + 20500 + 3000);
        let data = await this.shp.contract.transfer.getData(this.contributorOneAddress, withdraw);

        await this.bountyWallet.submitTransaction(
            this.shp.address, 
            0, 
            data, 
            {
                from: this.bountySignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600 + 50 + 5500 + 10500 + 15500 + 20500 + 3000,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000 - 50,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500 + 102500 + 15000,
            bountyBalance: 0
        });
    });
    
    it('should not be able to move SHP founders tokens before cliff', async function() {

        let withdraw = web3.toWei(50);
        let data = await this.shp.contract.transfer.getData(this.contributorOneAddress, withdraw);

        await this.foundersWallet.submitTransaction(
            this.shp.address, 
            0, 
            data, 
            {
                from: this.foundersSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600 + 50 + 5500 + 10500 + 15500 + 20500 + 3000,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000 - 50,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500 + 102500 + 15000,
            bountyBalance: 0
        });
    });

    it('should move some SHP reserve tokens after cliff', async function() {
        const sevenMonths = (60 * 60 * 24 * 30) * 7;
        await time.increaseTime(sevenMonths);

        let data = await this.trusteeWallet.contract.unlockVestedTokens.getData();  
        
        await this.reserveWallet.submitTransaction(
            this.trusteeWallet.address, 
            0, 
            data, 
            {
                from: this.reserveSignAddress
            }
        );
        
        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600 + 50 + 5500 + 10500 + 15500 + 20500 + 3000,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000 - 50,
            reserveBalance: 47596,
            foundersBalance: 0,
            trusteeBalance: 27500 + 52500 + 77500 + 102500 + 15000 - 47596,
            bountyBalance: 0
        });
    });
     it('should move some SHP founders tokens after cliff', async function() {

        let data = await this.trusteeWallet.contract.unlockVestedTokens.getData();
        
        await this.foundersWallet.submitTransaction(
            this.trusteeWallet.address, 
            0, 
            data, 
            {
                from: this.foundersSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600 + 50 + 5500 + 10500 + 15500 + 20500 + 3000,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000 - 50,
            reserveBalance: 47596,
            foundersBalance: 31731,
            trusteeBalance: 27500 + 52500 + 77500 + 102500 + 15000 - 47596 - 31731,
            bountyBalance: 0
        });
    });

    it('should move all SHP reserve tokens when fully vested', async function() {

        const eighteenMonths = (60 * 60 * 24 * 30) * 18;
        await time.increaseTime(eighteenMonths);

        let data = await this.trusteeWallet.contract.unlockVestedTokens.getData();
        
        await this.reserveWallet.submitTransaction(
            this.trusteeWallet.address, 
            0, 
            data, 
            {
                from: this.reserveSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600 + 50 + 5500 + 10500 + 15500 + 20500 + 3000,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000 - 50,
            reserveBalance: 165000,
            foundersBalance: 31731,
            trusteeBalance: 78269,
            bountyBalance: 0
        });
    });

    it('should move all SHP founders tokens when fully vested', async function() {

        let data = await this.trusteeWallet.contract.unlockVestedTokens.getData();
        
        await this.foundersWallet.submitTransaction(
            this.trusteeWallet.address, 
            0, 
            data, 
            {
                from: this.foundersSignAddress
            }
        );

        await assertions.SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 74400 + 106600 + 50 + 5500 + 10500 + 15500 + 20500 + 3000,
            contributorTwoBalance: 23100 + 46200 + 12000 + 2000 - 50,
            reserveBalance: 165000,
            foundersBalance: 110000,
            trusteeBalance: 0,
            bountyBalance: 0
        });
    });
});