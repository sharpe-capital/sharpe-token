const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("Presale initialization and permissions", function(accounts) {

    before(async function() {
        await testConfig.setupForPreSale(accounts);
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
                preSaleCap: testConfig.preSaleCap,
                minPresaleContributionEther: testConfig.minPresaleContributionEther,
                maxPresaleContributionEther: testConfig.maxPresaleContributionEther,
                firstTierDiscountUpperLimitEther: testConfig.firstTierDiscountUpperLimitEther,
                secondTierDiscountUpperLimitEther: testConfig.secondTierDiscountUpperLimitEther,
                thirdTierDiscountUpperLimitEther: testConfig.thirdTierDiscountUpperLimitEther,
            }
        );
    });

    it('should allow owner to resume the sale', async function(){
        await testConfig.preSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should not allow contribution range to be set if not owner', async function() {
        await assertFail(async function() {
            await testConfig.preSale.setContributionRange(
                testConfig.minPresaleContributionEther,
                testConfig.maxPresaleContributionEther,
                {
                    from: testConfig.contributorTwoAddress
                }
            )
        });
    });

    it('should allow contribution range to be set by owner', async function() {

        await testConfig.preSale.setContributionRange(
            testConfig.minPresaleContributionEther,
            testConfig.maxPresaleContributionEther,
            {
                from: testConfig.ownerAddress
            }
        );

        let actualMinPresaleContributionEther = (await testConfig.preSale.minPresaleContributionEther()).toNumber();
        assert.equal(testConfig.minPresaleContributionEther, actualMinPresaleContributionEther);
    
        let actualMaxPresaleContributionEther = (await testConfig.preSale.maxPresaleContributionEther()).toNumber();
        assert.equal(testConfig.maxPresaleContributionEther, actualMaxPresaleContributionEther);
        
        assertions.cleanState(testConfig.preSale);
    });

    it('should not allow discount limits to be set if not owner', async function() {
        await assertFail(async function() {
            await testConfig.preSale.setDiscountLimits(
                testConfig.firstTierDiscountUpperLimitEther,
                testConfig.secondTierDiscountUpperLimitEther,
                testConfig.thirdTierDiscountUpperLimitEther,
                {
                    from: testConfig.contributorTwoAddress
                }
            )
        });
    });

    it('should allow discount limits to be set by owner', async function() {

        await testConfig.preSale.setDiscountLimits(
            testConfig.firstTierDiscountUpperLimitEther,
            testConfig.secondTierDiscountUpperLimitEther,
            testConfig.thirdTierDiscountUpperLimitEther,
            {
                from: testConfig.ownerAddress
            }
        );

        let actualFirstTierDiscountUpperLimitEther = (await testConfig.preSale.firstTierDiscountUpperLimitEther()).toNumber();
        assert.equal(testConfig.firstTierDiscountUpperLimitEther, actualFirstTierDiscountUpperLimitEther);
    
        let actualSecondTierDiscountUpperLimitEther = (await testConfig.preSale.secondTierDiscountUpperLimitEther()).toNumber();
        assert.equal(testConfig.secondTierDiscountUpperLimitEther, actualSecondTierDiscountUpperLimitEther);

        let actualThirdTierDiscountUpperLimitEther = (await testConfig.preSale.thirdTierDiscountUpperLimitEther()).toNumber();
        assert.equal(testConfig.thirdTierDiscountUpperLimitEther, actualThirdTierDiscountUpperLimitEther);

        assertions.cleanState(testConfig.preSale);
    });

    it('shoud not allow presale cap to be enabled if not owner', async function() {
        await assertFail(async function() {
            await testConfig.preSale.setPresaleCap(1000, {
                from: testConfig.contributorTwoAddress
            })
        });
        assert.equal(testConfig.preSaleCap, (await testConfig.preSale.preSaleCap()).toNumber());
        assertions.cleanState(testConfig.preSale);
    });

    it('should allow presale cap to be set by owner', async function() {
        await testConfig.preSale.setPresaleCap(testConfig.preSaleCap, {
            from: testConfig.ownerAddress
        });
        assert.equal(testConfig.preSaleCap, (await testConfig.preSale.preSaleCap()).toNumber());
        assertions.cleanState(testConfig.preSale);
    });

    it('should not accept contributions below minimum threshold', async function() {
        let wei = web3.toWei('24', 'ether');
        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: wei,
                from: testConfig.contributorTwoAddress
            })
        });
    });

    it('should not accept contributions above maximum threshold', async function() {
        let wei = web3.toWei('2501', 'ether');
        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: maxPresaleContributionEther + 1,
                from: testConfig.contributorTwoAddress
            })
        });
        assertions.cleanState(testConfig.preSale);
    });
    
    it('should prevent 0 ETH contributions', async function() {
        await assertFail(async function() {
            await testConfig.preSale.sendTransaction({
                value: 0, 
                from: testConfig.contributorOneAddress
            });
        });
        assertions.cleanState(testConfig.preSale);
    });

    it('should not accept contributions from a contract address', async function() {
        
        let contribution = web3.toWei('25', 'ether');
        await assertFail(async function() {
            await testConfig.maliciousContract.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });

        let preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(0));
    });

    it('should only allow owner to add to whitelist', async function() {
        let plannedContribution = web3.toWei('25', 'ether');
        await assertFail(async function() {
            await testConfig.preSale.addToWhitelist(
                testConfig.contributorTwoAddress,
                plannedContribution,
                {
                    from: testConfig.contributorTwoAddress
                }
            )
        });

        plannedContribution = web3.toWei('25', 'ether');
        await testConfig.preSale.addToWhitelist(
            testConfig.contributorTwoAddress,
            plannedContribution,
            {
                from: testConfig.ownerAddress
            }
        );
    });

    it('should not allow the same address to be whitelisted more than once', async function() {
        let plannedContribution = web3.toWei('25', 'ether');
        await assertFail(async function() {
            await testConfig.preSale.addToWhitelist(
                testConfig.contributorTwoAddress,
                plannedContribution,
                {
                    from: testConfig.ownerAddress
                }
            )
        });
    });



});