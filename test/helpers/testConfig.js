const Presale = artifacts.require("SharpePresale");
const GeneralSale = artifacts.require("SharpeCrowdsale");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const SHP = artifacts.require("SHP");
const SCD = artifacts.require("SCD");
const DynamicCeiling = artifacts.require("DynamicCeiling");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const Trustee = artifacts.require("Trustee");
const AffiliateUtility = artifacts.require("AffiliateUtility");
const SHPController = artifacts.require("SHPController");
const MaliciousContract = artifacts.require("MaliciousContract");

const assertions = require("./assertions");

class TestConfig {

    constructor() {}

    async generalSetup(accounts) {
        console.log('Logging out all of the accounts for reference...');
        accounts.forEach(acc => console.log(acc + ' -> ' + web3.fromWei(web3.eth.getBalance(acc).toNumber())));
        this.etherPeggedValue = 400;
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
        this.scd = await SCD.new(this.miniMeTokenFactory.address);

        const affiliateTierTwo = web3.toWei(1) * (3000 / 300);
        const affiliateTierThree = web3.toWei(1) * (6000 / 300);

        this.etherEscrowWallet = await MultiSigWallet.new([this.escrowSignAddress], 1);
        this.bountyWallet = await MultiSigWallet.new([this.bountySignAddress], 1);
        this.foundersWallet = await MultiSigWallet.new([this.foundersSignAddress], 1);
        this.reserveWallet = await MultiSigWallet.new([this.reserveSignAddress], 1);
        this.trusteeWallet = await Trustee.new(this.shp.address);
        this.affiliateUtility = await AffiliateUtility.new(affiliateTierTwo, affiliateTierThree);

        this.etherEscrowAddress = this.etherEscrowWallet.address;
        this.foundersAddress = this.foundersWallet.address;
        this.reserveAddress = this.reserveWallet.address;
        this.bountyAddress = this.bountyWallet.address;
        this.trusteeAddress = this.trusteeWallet.address;

        this.shpController = await SHPController.new(
            this.reserveAddress,
            this.foundersAddress
        );

        await this.shpController.setContracts(this.shp.address, this.trusteeAddress);

        console.log("ownerAddress: " + this.ownerAddress);
        console.log("contributorOneAddress: " + this.contributorOneAddress);
        console.log("contributorTwoAddress: " + this.contributorTwoAddress);
    }
    async setUpForGeneralSale(accounts, includeGeneral) {
        if (includeGeneral) {
            await this.generalSetup(accounts);
        }
        this.MIN_GENERAL_SALE_CONTRIBUTION = 100;
        this.MAX_GENERAL_SALE_CONTRIBUTION = 1000;
        this.GENERAL_SALE_HARDCAP = 4400;
        this.minContributionInWei = web3.toWei(this.MIN_GENERAL_SALE_CONTRIBUTION / this.etherPeggedValue);
        this.generalSale = await GeneralSale.new(
            this.etherEscrowWallet.address,
            this.bountyWallet.address,
            this.trusteeWallet.address,
            this.affiliateUtility.address,
            this.apiAddress,
            this.minContributionInWei);

        if (includeGeneral) {
            await this.trusteeWallet.changeOwner(this.generalSale.address);
            await this.shp.changeController(this.generalSale.address);
            await this.generalSale.setShp(this.shp.address);
        }

        this.maliciousContract = await MaliciousContract.new(this.generalSale.address);

        this.dynamicCeiling = await DynamicCeiling.new(
            this.ownerAddress,
            this.generalSale.address
        );
        this.generalSale.setDynamicCeilingAddress(this.dynamicCeiling.address);

        if (includeGeneral) {
            assertions.initialize(
                this.etherEscrowAddress,
                this.generalSale.address,
                this.contributorOneAddress,
                this.contributorTwoAddress,
                this.reserveAddress,
                this.foundersAddress,
                this.trusteeAddress,
                this.bountyAddress,
                this.masterAddress,
                this.shp);
        }

    }
    async setupForPreSale(accounts, tweakLimits, capInEther) {

        await this.generalSetup(accounts);

        this.MIN_PRESALE_CONTRIBUTION = 10000;
        this.MAX_PRESALE_CONTRIBUTION = 1000000;
        this.FIRST_TIER_DISCOUNT_UPPER_LIMIT = 49999;
        this.SECOND_TIER_DISCOUNT_UPPER_LIMIT = 249999;
        this.THIRD_TIER_DISCOUNT_UPPER_LIMIT = 1000000;
        this.PRESALE_CAP = 10000000;

        if (tweakLimits) {
            // Tweak values because test accounts only have 100 ETH
            this.minPresaleContributionEther = web3.toWei(500 / this.etherPeggedValue);
            this.maxPresaleContributionEther = web3.toWei(5000 / this.etherPeggedValue);
            this.firstTierDiscountUpperLimitEther = web3.toWei(1000 / this.etherPeggedValue);
            this.secondTierDiscountUpperLimitEther = web3.toWei(2000 / this.etherPeggedValue) - 1;
            this.thirdTierDiscountUpperLimitEther = web3.toWei(4000 / this.etherPeggedValue);
        } else {
            this.minPresaleContributionEther = web3.toWei(this.MIN_PRESALE_CONTRIBUTION / this.etherPeggedValue);
            this.maxPresaleContributionEther = web3.toWei(this.MAX_PRESALE_CONTRIBUTION / this.etherPeggedValue);
            this.firstTierDiscountUpperLimitEther = web3.toWei(this.FIRST_TIER_DISCOUNT_UPPER_LIMIT / this.etherPeggedValue);
            this.secondTierDiscountUpperLimitEther = web3.toWei(this.SECOND_TIER_DISCOUNT_UPPER_LIMIT / this.etherPeggedValue);
            this.thirdTierDiscountUpperLimitEther = web3.toWei(this.THIRD_TIER_DISCOUNT_UPPER_LIMIT / this.etherPeggedValue);
        }

        

        if (capInEther && capInEther > 0) {
            this.preSaleCap = web3.toWei(capInEther);
        } else {
            this.preSaleCap = web3.toWei(this.PRESALE_CAP / this.etherPeggedValue);
        }

        console.log("cap is set to " + this.preSaleCap);

        this.honourWhitelistEnd = new Date(2017, 10, 9, 9, 0, 0, 0).getTime();
        // console.log("honourWhitelistEnd " + this.honourWhitelistEnd);

        this.preSale = await Presale.new(
            this.etherEscrowWallet.address,
            this.bountyWallet.address,
            this.trusteeWallet.address,
            this.affiliateUtility.address,
            this.apiAddress,
            this.firstTierDiscountUpperLimitEther,
            this.secondTierDiscountUpperLimitEther,
            this.thirdTierDiscountUpperLimitEther,
            this.minPresaleContributionEther,
            this.maxPresaleContributionEther,
            this.preSaleCap,
            this.honourWhitelistEnd
        );

        this.preSaleAddress = this.preSale.address;

        await this.trusteeWallet.changeOwner(this.preSale.address);
        await this.shp.changeController(this.preSale.address);
        await this.preSale.setShp(this.shp.address);

        this.maliciousContract = await MaliciousContract.new(this.preSaleAddress);

        assertions.initialize(
            this.etherEscrowAddress,
            this.preSaleAddress,
            this.contributorOneAddress,
            this.contributorTwoAddress,
            this.reserveAddress,
            this.foundersAddress,
            this.trusteeAddress,
            this.bountyAddress,
            this.masterAddress,
            this.shp);

        console.log("preSaleAddress: " + this.preSaleAddress);

        // console.log("minPresaleContributionEther: " + this.minPresaleContributionEther);
        // console.log("maxPresaleContributionEther: " + this.maxPresaleContributionEther);
        // console.log("firstTierDiscountUpperLimitEther: " + this.firstTierDiscountUpperLimitEther);
        // console.log("secondTierDiscountUpperLimitEther: " + this.secondTierDiscountUpperLimitEther);
        // console.log("thirdTierDiscountUpperLimitEther: " + this.thirdTierDiscountUpperLimitEther);
        // console.log("preSaleCap: " + this.preSaleCap);
    }
}

module.exports = new TestConfig();