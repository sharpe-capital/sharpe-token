const Presale = artifacts.require("PresaleMock");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const SHP = artifacts.require("SHP");
const SCD = artifacts.require("SCD");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const FoundersWallet = artifacts.require("FoundersWalletMock");
const ReserveWallet = artifacts.require("ReserveWalletMock");
const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");

contract("Presale", function(accounts) {

    console.log('Logging out all of the accounts for reference...');
    accounts.forEach(acc => console.log(acc));

    const contributorOneAddress = accounts[1];
    const contributorTwoAddress = accounts[2];
    const escrowSignAddress = accounts[3];
    const reserveSignAddress = accounts[4];
    const foundersSignAddress = accounts[5];

    const MIN_PRESALE_CONTRIBUTION = 10000;
    const MAX_PRESALE_CONTRIBUTION = 1000000;

    const FIRST_TIER_DISCOUNT_UPPER_LIMIT = 49999;
    const SECOND_TIER_DISCOUNT_UPPER_LIMIT = 249999;
    const THIRD_TIER_DISCOUNT_UPPER_LIMIT = 1000000;
    const PRESALE_CAP = 10000000;

    let etherEscrowWallet;
    let foundersWallet;
    let reserveWallet;
    let preSale;
    let miniMeTokenFactory;
    let shp;
    let scd;

    let preSaleAddress;
    let etherEscrowAddress;
    let foundersAddress;
    let reserveAddress;
    let ownerAddress;

    let etherPeggedValue = 400;
    let minPresaleContributionEther;
    let maxPresaleContributionEther;
        
    let firstTierDiscountUpperLimitEther;
    let secondTierDiscountUpperLimitEther;
    let thirdTierDiscountUpperLimitEther;
    
    let preSaleCap;

    before(async function() {

        miniMeTokenFactory = await MiniMeTokenFactory.new();
        preSale = await Presale.new();
        ownerAddress = accounts[0];

        shp = await SHP.new(miniMeTokenFactory.address);
        scd = await SCD.new(miniMeTokenFactory.address);

        etherEscrowWallet = await MultiSigWallet.new([escrowSignAddress], 1);
        foundersWallet = await FoundersWallet.new(shp.address, preSale.address); // TODO - could apply multisign to this wallet
        reserveWallet = await ReserveWallet.new(shp.address, preSale.address); // TODO - could apply multisign to this wallet
        
        preSaleAddress = preSale.address;
        etherEscrowAddress = etherEscrowWallet.address;
        foundersAddress = foundersWallet.address;
        reserveAddress = reserveWallet.address;
        
        //Tweaked values as accounts only have 100 ether
        minPresaleContributionEther = web3.toWei(500/etherPeggedValue);
        maxPresaleContributionEther = web3.toWei(5000/etherPeggedValue);        
        firstTierDiscountUpperLimitEther = web3.toWei(1000/etherPeggedValue);
        secondTierDiscountUpperLimitEther = web3.toWei(2000/etherPeggedValue) - 1;
        thirdTierDiscountUpperLimitEther = web3.toWei(4000/etherPeggedValue);

        preSaleCap = web3.toWei(PRESALE_CAP/etherPeggedValue);

        await shp.changeController(preSale.address);

        assertions.initialize(
            etherEscrowAddress, 
            preSaleAddress, 
            contributorOneAddress, 
            contributorTwoAddress, 
            reserveAddress, 
            foundersAddress,
            shp);

        await preSale.initialize(
            etherEscrowWallet.address, 
            reserveWallet.address, 
            foundersWallet.address, 
            shp.address,
            scd.address,
            firstTierDiscountUpperLimitEther,
            secondTierDiscountUpperLimitEther,
            thirdTierDiscountUpperLimitEther,
            minPresaleContributionEther,
            maxPresaleContributionEther,
            preSaleCap);

        console.log("ownerAddress: " + ownerAddress);
        console.log("contributorOneAddress: " + contributorOneAddress);
        console.log("contributorTwoAddress: " + contributorTwoAddress);
        console.log("preSaleAddress: " + preSaleAddress);
        
        console.log("minPresaleContributionEther: " + minPresaleContributionEther);
        console.log("maxPresaleContributionEther: " + maxPresaleContributionEther);
        console.log("firstTierDiscountUpperLimitEther: " + firstTierDiscountUpperLimitEther);
        console.log("secondTierDiscountUpperLimitEther: " + secondTierDiscountUpperLimitEther);
        console.log("thirdTierDiscountUpperLimitEther: " + thirdTierDiscountUpperLimitEther);
        console.log("preSaleCap: " + preSaleCap);

    });

    it('should initialize contract with expected values', async function() {
        assertions.expectedInitialisation(
            preSale, 
            {
                etherEscrowWallet: etherEscrowWallet,
                reserveWallet: reserveWallet,
                foundersWallet: foundersWallet
            },
            {
                preSaleCap: preSaleCap,
                minPresaleContributionEther: minPresaleContributionEther,
                maxPresaleContributionEther: maxPresaleContributionEther,
                firstTierDiscountUpperLimitEther: firstTierDiscountUpperLimitEther,
                secondTierDiscountUpperLimitEther: secondTierDiscountUpperLimitEther,
                thirdTierDiscountUpperLimitEther: thirdTierDiscountUpperLimitEther,
            }
        );
    });

    it('should apply first tier discount', async function() {
        await preSale.sendTransaction({
            value: firstTierDiscountUpperLimitEther,
            gas: 3000000,
            gasPrice: "1000000", 
            from: contributorOneAddress
        })
        .then(result => eventsUtil.eventLogger(result));


        assertions.ether({
            etherEscrowBalance: 2.5,
            contributionBalance: 0,
            contributorOneBalance: 97.5,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 5500,
            contributorTwoBalance: 0,
            reserveBalance: 5000,
            foundersBalance: 2500
        });

        let preSaleEtherPaid = (await preSale.preSaleEtherPaid()).toNumber();
        console.log("preSaleEtherPaid: " + preSaleEtherPaid);
        assert.equal(preSaleEtherPaid, web3.toWei(2.5));
    });

        
    it('should apply second tier discount', async function() {
        await preSale.sendTransaction({
            value: secondTierDiscountUpperLimitEther,
            gas: 3000000,
            gasPrice: "1000000", 
            from: contributorTwoAddress
        })
        .then(result => eventsUtil.eventLogger(result));

        assertions.ether({
            etherEscrowBalance: 7.5,
            contributionBalance: 0,
            contributorOneBalance: 97.5,
            contributorTwoBalance: 95,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 5500,
            contributorTwoBalance: 12000,
            reserveBalance: 15000,
            foundersBalance: 7500
        });

        let preSaleEtherPaid = (await preSale.preSaleEtherPaid()).toNumber();
        console.log("preSaleEtherPaid: " + preSaleEtherPaid);
        assert.equal(preSaleEtherPaid, web3.toWei(7.5));
    });

    it('should apply third tier discount', async function() {
        await preSale.sendTransaction({
            value: thirdTierDiscountUpperLimitEther,
            gas: 3000000,
            gasPrice: "1000000", 
            from: contributorTwoAddress
        })
        .then(result => eventsUtil.eventLogger(result));

        assertions.ether({
            etherEscrowBalance: 17.5,
            contributionBalance: 0,
            contributorOneBalance: 97.5,
            contributorTwoBalance: 85,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 5500,
            contributorTwoBalance: 38000,
            reserveBalance: 35000,
            foundersBalance: 17500
        });

        let preSaleEtherPaid = (await preSale.preSaleEtherPaid()).toNumber();
        console.log("preSaleEtherPaid: " + preSaleEtherPaid);
        assert.equal(preSaleEtherPaid, web3.toWei(17.5));
    });
});