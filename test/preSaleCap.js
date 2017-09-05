const Presale = artifacts.require("PreSaleMock");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const SHP = artifacts.require("SHP");
const SCD = artifacts.require("SCD");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const FoundersWallet = artifacts.require("FoundersWalletMock");
const ReserveWallet = artifacts.require("ReserveWalletMock");
const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");

contract("PreSale", function(accounts) {
    
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
        
        minPresaleContributionEther = web3.toWei(MIN_PRESALE_CONTRIBUTION/etherPeggedValue);
        maxPresaleContributionEther = web3.toWei(MAX_PRESALE_CONTRIBUTION/etherPeggedValue);
        
        firstTierDiscountUpperLimitEther = web3.toWei(FIRST_TIER_DISCOUNT_UPPER_LIMIT/etherPeggedValue);
        secondTierDiscountUpperLimitEther = web3.toWei(SECOND_TIER_DISCOUNT_UPPER_LIMIT/etherPeggedValue);
        thirdTierDiscountUpperLimitEther = web3.toWei(THIRD_TIER_DISCOUNT_UPPER_LIMIT/etherPeggedValue);

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

    it('should accept valid contribution', async function() {
        await preSale.sendTransaction({
            value: minPresaleContributionEther,
            gas: 3000000,
            gasPrice: "20000000000", 
            from: contributorOneAddress
        });

        assertions.ether({
            etherEscrowBalance: 25,
            contributionBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 0,
            reserveBalance: 50000,
            foundersBalance: 25000
        });

        let preSaleEtherPaid = (await preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(25));
    });

    it('should not accept contributions over pre-sale cap', async function() {
        let newPresaleCap = web3.toWei('25', 'ether');
        await preSale.setPresaleCap(
            newPresaleCap,
            {
                from: ownerAddress
            }
        );
        
        let preSaleCap = (await preSale.preSaleCap()).toNumber();
        assert.equal(preSaleCap, web3.toWei(25));

        let gracePeriod = await preSale.gracePeriod();
        assert.equal(gracePeriod, false);

        let closed = await preSale.closed();
        assert.equal(closed, false);

        let contribution = web3.toWei('26', 'ether');

        await assertFail(async function() {
            await preSale.sendTransaction({
                value: contribution,
                gas: 3000000,
                gasPrice: "20000000000", 
                from: contributorTwoAddress
            })
        });

        assertions.ether({
            etherEscrowBalance: 25,
            contributionBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 0,
            reserveBalance: 50000,
            foundersBalance: 25000
        });

        let preSaleEtherPaid = (await preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(25));
    });

    it('should accept last contribution before cap and refund exceeds to sender', async function() {
        let newPresaleCap = web3.toWei('50', 'ether');
        await preSale.setPresaleCap(
            newPresaleCap,
            {
                from: ownerAddress
            }
        );

        const newPreSaleCap = await preSale.preSaleCap();
        
        let contribution = web3.toWei('26', 'ether');
        await preSale.sendTransaction({
            value: contribution,
            gas: 3000000,
            gasPrice: "20000000000", 
            from: contributorTwoAddress
        })
        .then(result => {
            eventsUtil.eventValidator(
                result, 
                {
                    name: "ContributionRefund",
                    args: {
                        etherAmount: web3.toWei('1', 'ether'),
                        caller: contributorTwoAddress
                    }
                }
            );
            eventsUtil.eventValidator(
                result, 
                {
                    name: "PresaleClosed",
                }
            );
        });

        assertions.ether({
            etherEscrowBalance: 50,
            contributionBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 55000,
            reserveBalance: 100000,
            foundersBalance: 50000
        });

        let preSaleEtherPaid = (await preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(50));

        let closed = await preSale.closed();
        assert.equal(closed, true);

        await assertFail(async function() {
            await preSale.sendTransaction({
                value: contribution,
                gas: 3000000,
                gasPrice: "20000000000", 
                from: contributorTwoAddress
            })
        });

        assertions.ether({
            etherEscrowBalance: 50,
            contributionBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 55000,
            reserveBalance: 100000,
            foundersBalance: 50000
        });
    });

});