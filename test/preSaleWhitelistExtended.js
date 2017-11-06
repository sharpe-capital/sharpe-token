const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");
const time = require("./helpers/time");

contract("Presale whitelist extended", function(accounts) {

    let contributorThreeAddress = accounts[8];
    let contributorFourAddress = accounts[9];

    before(async function() {
        await testConfig.setupForPreSale(accounts, false, 0);
        console.log("contributorThreeAddress " + contributorThreeAddress);
        console.log("contributorFourAddress " + contributorFourAddress);
    });

    it('should initialize contract with expected values', async function() {
        await assertions.expectedInitialisation(
            testConfig.preSale, {
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
            }
        );
        let beforeWhitelistPeriod = new Date(2017, 10, 9, 9, 0, 0, 0).getTime();
        await time.increaseTime(beforeWhitelistPeriod);
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

    it('should allow owner to resume the sale', async function() {
        await testConfig.preSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const paused = await testConfig.preSale.paused();
        assert.equal(false, paused);
    });

    it('should allow contribution from whitelisted contributor and remove contributor from whitelist after the sale', async function() {

        let plannedContribution = web3.toWei('25', 'ether');
        await testConfig.preSale.addToWhitelist(
            testConfig.contributorOneAddress,
            plannedContribution, {
                from: testConfig.ownerAddress
            }
        );
        await testConfig.preSale.addToWhitelist(
            testConfig.contributorTwoAddress,
            plannedContribution, {
                from: testConfig.ownerAddress
            }
        );

        let whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
        assert.equal(whitelistedPlannedContributions, web3.toWei(50));

        await testConfig.preSale.sendTransaction({
            value: plannedContribution,
            from: testConfig.contributorOneAddress
        });
            // .then(result => {
            //     eventsUtil.eventValidator(
            //         result, {
            //             name: "AllowedContributionCheck",
            //             args: {
            //                 contribution: web3.toWei('25', 'ether'),
            //                 allowedContributionState: 0
            //             }
            //         }
            //     );
            // });

        assertions.ether({
            etherEscrowBalance: 25,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500,
            bountyBalance: 12500
        });
    
        preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(25));
    
        preSaleCap = (await testConfig.preSale.preSaleCap()).toNumber();
        assert.equal(preSaleCap, web3.toWei(25));

        whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
        assert.equal(whitelistedPlannedContributions, web3.toWei(0));
    });

    it('should add contributors to whitelist', async function() {

        let plannedContribution = web3.toWei('35', 'ether');
        await testConfig.preSale.addToWhitelist(
            contributorThreeAddress,
            plannedContribution, {
                from: testConfig.ownerAddress
            }
        );

        plannedContribution = web3.toWei('65', 'ether');
        await testConfig.preSale.addToWhitelist(
            contributorFourAddress,
            plannedContribution, {
                from: testConfig.ownerAddress
            }
        );

        let whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
        assert.equal(whitelistedPlannedContributions, web3.toWei(100));
    });

    it('should set honour whitelist to false', async function() {

        let afterWhitelistPeriod = new Date(2017, 10, 10, 9, 0, 0, 0).getTime();
        await time.increaseTime(afterWhitelistPeriod);

        // Need a transaction to update the honourWhitelist flag, counters, etc..
        let plannedContribution = web3.toWei('25', 'ether');
        await testConfig.preSale.sendTransaction({
            value: plannedContribution,
            from: testConfig.contributorTwoAddress
        });

        assertions.ether({
            etherEscrowBalance: 50,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 75,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 55000,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500 * 2,
            bountyBalance: 12500 * 2
        });
    });

    it('should add remaining whitelisted planned contributions to cap after whitelist stops being honoured', async function() {
        let preSaleCap = (await testConfig.preSale.preSaleCap()).toNumber();
        assert.equal(preSaleCap, web3.toWei(100));

        let whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
        assert.equal(whitelistedPlannedContributions, web3.toWei(0));
    });

    it('should detect over whitelist period and allow contribution from cap', async function() {

        let plannedContribution = web3.toWei('25', 'ether');

        await testConfig.preSale.sendTransaction({
                value: plannedContribution,
                from: testConfig.contributorTwoAddress
            })
            .then(result => {
                eventsUtil.eventValidator(
                    result, {
                        name: "AllowedContributionCheck",
                        args: {
                            contribution: plannedContribution,
                            allowedContributionState: 4
                        }
                    }
                );
            });
        
        assertions.ether({
            etherEscrowBalance: 75,
            presaleBalance: 0,
            contributorOneBalance: 75,
            contributorTwoBalance: 50,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 55000,
            contributorTwoBalance: 55000 * 2,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 62500 * 3,
            bountyBalance: 12500 * 3
        });

        preSaleEtherPaid = (await testConfig.preSale.preSaleEtherPaid()).toNumber();
        assert.equal(preSaleEtherPaid, web3.toWei(75));

        let whitelistedPlannedContributions = (await testConfig.preSale.whitelistedPlannedContributions()).toNumber();
        assert.equal(whitelistedPlannedContributions, 0);

        let preSaleCap = (await testConfig.preSale.preSaleCap()).toNumber();
        assert.equal(preSaleCap, web3.toWei(75));
    });
});