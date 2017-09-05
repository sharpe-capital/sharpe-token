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

    it('should only allow contribution range to be set by owner', async function() {
        await assertFail(async function() {
            await preSale.setContributionRange(
                minPresaleContributionEther,
                maxPresaleContributionEther,
                {
                    from: contributorTwoAddress
                }
            )
        });

        await preSale.setContributionRange(
            minPresaleContributionEther,
            maxPresaleContributionEther,
            {
                from: ownerAddress
            }
        );

        let actualMinPresaleContributionEther = (await preSale.minPresaleContributionEther()).toNumber();
        assert.equal(minPresaleContributionEther, actualMinPresaleContributionEther);
    
        let actualMaxPresaleContributionEther = (await preSale.maxPresaleContributionEther()).toNumber();
        assert.equal(maxPresaleContributionEther, actualMaxPresaleContributionEther);
        
        assertions.cleanState(preSale);
    });

    it('should only allow discount limits to be set by owner', async function() {
        await assertFail(async function() {
            await preSale.setDiscountLimits(
                firstTierDiscountUpperLimitEther,
                secondTierDiscountUpperLimitEther,
                thirdTierDiscountUpperLimitEther,
                {
                    from: contributorTwoAddress
                }
            )
        });

        await preSale.setDiscountLimits(
            firstTierDiscountUpperLimitEther,
            secondTierDiscountUpperLimitEther,
            thirdTierDiscountUpperLimitEther,
            {
                from: ownerAddress
            }
        );

        let actualFirstTierDiscountUpperLimitEther = (await preSale.firstTierDiscountUpperLimitEther()).toNumber();
        assert.equal(firstTierDiscountUpperLimitEther, actualFirstTierDiscountUpperLimitEther);
    
        let actualSecondTierDiscountUpperLimitEther = (await preSale.secondTierDiscountUpperLimitEther()).toNumber();
        assert.equal(secondTierDiscountUpperLimitEther, actualSecondTierDiscountUpperLimitEther);

        let actualThirdTierDiscountUpperLimitEther = (await preSale.thirdTierDiscountUpperLimitEther()).toNumber();
        assert.equal(thirdTierDiscountUpperLimitEther, actualThirdTierDiscountUpperLimitEther);

        assertions.cleanState(preSale);
    });

    it('should only allow grace period to be enabled by owner', async function() {
        await assertFail(async function() {
            await preSale.enableGracePeriod(
                true,
                {
                    from: contributorTwoAddress
                }
            )
        });

        await preSale.enableGracePeriod(
            true,
            {
                from: ownerAddress
            }
        );

        assert.equal(true, await preSale.gracePeriod());

        // restore to init value
        await preSale.enableGracePeriod(
            false,
            {
                from: ownerAddress
            }
        );
        assert.equal(false, await preSale.gracePeriod());

        assertions.cleanState(preSale);
    });

    it('should only allow preSale cap to be enabled by owner', async function() {
        await assertFail(async function() {
            await preSale.setPresaleCap(
                1000,
                {
                    from: contributorTwoAddress
                }
            )
        });
        assert.equal(preSaleCap, (await preSale.preSaleCap()).toNumber());

        await preSale.setPresaleCap(
            preSaleCap,
            {
                from: ownerAddress
            }
        );
        assert.equal(preSaleCap, (await preSale.preSaleCap()).toNumber());
        assertions.cleanState(preSale);
    });

    it('should not accept contributions below minimum threshold', async function() {
        let wei = web3.toWei('24', 'ether');

        await assertFail(async function() {
            await preSale.sendTransaction({
                value: wei,
                gas: 3000000,
                gasPrice: "20000000000", 
                from: contributorTwoAddress
            })
        });
        
        assertions.cleanState(preSale);
    });

    it('should not accept contributions above maximum threshold', async function() {
        let wei = web3.toWei('2501', 'ether');
        
        await assertFail(async function() {
            await preSale.sendTransaction({
                value: maxPresaleContributionEther + 1,
                gas: 3000000,
                gasPrice: "20000000000", 
                from: contributorTwoAddress
            })
        });
        
        assertions.cleanState(preSale);

    });
    
    it('should prevent 0 ETH contributions', async function() {
        await assertFail(async function() {
            await preSale.sendTransaction({
                value: 0, 
                gas: 3000000,
                gasPrice: "20000000000", 
                from: contributorOneAddress
            }).then(result => eventsUtil.eventLogger(result));
        });
        
        assertions.cleanState(preSale);
    });

    it('should not accept contributions from contribution address', async function() {
        await assertFail(async function() {
            await preSale.sendTransaction({
                value: minPresaleContributionEther,
                gas: 3000000,
                gasPrice: "20000000000", 
                from: contributionAddress
            });
        });
        assertions.cleanState(preSale);
    });

    it('should not accept contributions from ether escrow address', async function() {
        await assertFail(async function() {
            await preSale.sendTransaction({
                value: minPresaleContributionEther,
                gas: 3000000,
                gasPrice: "20000000000", 
                from: etherEscrowAddress
            });
        });
        assertions.cleanState(preSale);
    });

    it('should not accept contributions from founder address', async function() {
        await assertFail(async function() {
            await preSale.sendTransaction({
                value: minPresaleContributionEther,
                gas: 3000000,
                gasPrice: "20000000000", 
                from: foundersAddress
            });
        });
        assertions.cleanState(preSale);
    });

    it('should not accept contributions from reserve address', async function() {
        await assertFail(async function() {
            await preSale.sendTransaction({
                value: minPresaleContributionEther,
                gas: 3000000,
                gasPrice: "20000000000", 
                from: reserveAddress
            });
        });
        assertions.cleanState(preSale);
    });
});