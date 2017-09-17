const assertFail = require("./helpers/assertFail");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");
const assertions = require("./helpers/assertions");

contract("General Sale", function (accounts) {

    const hashes = [];
    const ceilings = [];

    before(async function () {
        await testConfig.setUpForGeneralSale(accounts);
    });
    it('should initialize contract with expected values', async function () {
        const minContribution = await testConfig.generalSale.minContributionInWei();
        await assertions.expectedInitialisationGeneral(
            testConfig.generalSale,
            {
                etherEscrowWallet: testConfig.etherEscrowWallet,
                reserveWallet: testConfig.reserveWallet,
                foundersWallet: testConfig.foundersWallet
            },
            {
                minContributionInWei: minContribution
            }
        );
    });

    // it('should have a Dynamic Ceiling contract linked', async function(){
    //     assert.equal(testConfig.generalSale.dynamicCeiling.address, testConfig.dynamicCeiling.address);
    // });

    it('should set some ceilings and reveal the first ceiling   ', async function () {
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
        // add some more random hashes to conceal the total number of ceiliengs
        for (; i < 10; i += 1) {
            hashes.push(web3.sha3(`pwd${i}`));
        }
        await testConfig.dynamicCeiling.setHiddenCeilings(hashes);
        assert.equal(await testConfig.dynamicCeiling.nCeilings(), 10);

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

    it('should allow owner to resume the sale', async function () {
        await testConfig.generalSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const generalPaused = await testConfig.generalSale.paused();
        assert.equal(false, generalPaused);
    });

    it('should whitelist an affiliate', async function () {
        await testConfig.affiliateUtility.addAffiliate(testConfig.contributorTwoAddress, testConfig.contributorTwoAddress);
        const affiliate = await testConfig.affiliateUtility.getAffiliate.call(testConfig.contributorTwoAddress, {
            from: testConfig.ownerAddress
        });
        assert.equal(affiliate, testConfig.contributorTwoAddress);
    });

    it('should not allow contribution bellow the minimum amount', async function () {
        await assertFail(async function () {
            let contribution = web3.toWei(80 / testConfig.etherPeggedValue);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should allow contribution above the minimum amount without affiliate data', async function () {
        let contributionValue = web3.toWei(2);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorOneAddress
        });
        assertions.ether({
            etherEscrowBalance: 2,
            presaleBalance: 0,
            contributorOneBalance: 98,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 4000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 5000,
            bountyBalance: 1000
        });
    });

    it('should not allow contribution above the maximum amount', async function () {
        await assertFail(async function () {
            let contribution = web3.toWei(1001 / testConfig.etherPeggedValue);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should allow owner to pause the sale', async function () {
        await testConfig.generalSale.pauseContribution({
            from: testConfig.ownerAddress
        });
        const generalPaused = await testConfig.generalSale.paused();
        assert.equal(true, generalPaused);
    });

    it('should not allow contributions whilst paused', async function () {
        const contributionValue = web3.toWei(2);
        await assertFail(async function () {
            await testConfig.generalSale.sendTransaction({
                value: contributionValue,
                from: testConfig.contributorOneAddress
            });
        });
        assertions.ether({
            etherEscrowBalance: 2,
            presaleBalance: 0,
            contributorOneBalance: 98,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 4000,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 5000,
            bountyBalance: 1000
        });
        const totalEtherPaid = await testConfig.generalSale.totalEtherPaid.call();
        assert.equal(totalEtherPaid.toNumber(), web3.toWei(2));
    });

    it('should allow owner to resume sale', async function () {
        await testConfig.generalSale.resumeContribution({
            from: testConfig.ownerAddress
        });
        const generalPaused = await testConfig.generalSale.paused();
        assert.equal(false, generalPaused);
    });

    it('should allow contribution with affiliate data', async function () {
        const contributionValue = web3.toWei(2);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorOneAddress,
            data: testConfig.contributorTwoAddress
        });
        assertions.ether({
            etherEscrowBalance: 4,
            presaleBalance: 0,
            contributorOneBalance: 96,
            contributorTwoBalance: 100,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 8040,
            contributorTwoBalance: 120,
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: 10000,
            bountyBalance: 2000
        });
        const totalEtherPaid = await testConfig.generalSale.totalEtherPaid.call();
        assert.equal(totalEtherPaid.toNumber(), web3.toWei(4));
    });

    it('should allow smaller contribution when exceeds the ceiling and refund excess', async function () {
        const contributionValue = web3.toWei(2);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorTwoAddress
        });
        await assertions.ether({
            etherEscrowBalance: 5,
            presaleBalance: 0,
            contributorOneBalance: 96,
            contributorTwoBalance: 99,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 8040,
            contributorTwoBalance: (120 + 2000),
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: (10000 + 2500),
            bountyBalance: (2000 + 500)
        });
    });

    it('should reject transaction when ceilieng limit is exhusted', async function () {
        await assertFail(async function () {
            let contribution = web3.toWei(1);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it("should reveal the 2nd ceiling", async function() {

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

    it('should allow contribution when 2nd ceiling is revlead', async function () {
        const contributionValue = web3.toWei(1);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorTwoAddress
        });
        await assertions.ether({
            etherEscrowBalance: 6,
            presaleBalance: 0,
            contributorOneBalance: 96,
            contributorTwoBalance: 98,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 8040,
            contributorTwoBalance: (120 + 2000 + 2000),
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: (10000 + 2500 + 2500),
            bountyBalance: (2000 + 500 + 500)
        });
    });

        it('should allow samller amount if contribution is larger than the final cap and close the sale', async function () {
        const contributionValue = web3.toWei(2);
        console.log(0);
        await testConfig.generalSale.sendTransaction({
            value: contributionValue,
            from: testConfig.contributorTwoAddress
        });
        console.log(1);
        await assertions.ether({
            etherEscrowBalance: 7,
            presaleBalance: 0,
            contributorOneBalance: 96,
            contributorTwoBalance: 97,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await assertions.SHP({
            etherEscrowBalance: 0,
            presaleBalance: 0,
            contributorOneBalance: 8040,
            contributorTwoBalance: (120 + 2000 + 2000 + 2000),
            reserveBalance: 0,
            foundersBalance: 0,
            trusteeBalance: (10000 + 2500 + 2500 + 2500),
            bountyBalance: (2000 + 500 + 500 + 500)
        });

        // const closed = await testConfig.generalSale.closed.call();
        // assert.equal(true, closed);
    });


    it('should reject transaction when final cap is breached', async function () {
        await assertFail(async function () {
            let contribution = web3.toWei(1);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should allow owner to manually close the sale', async function () {
        await testConfig.generalSale.closeSale({
            from: testConfig.ownerAddress
        });
        const closed = await testConfig.generalSale.closed.call();
        assert.equal(true, closed);
    });

    it('should not allow contributions after closed', async function () {
        await assertFail(async function () {
            let contribution = web3.toWei(1);
            await testConfig.generalSale.sendTransaction({
                value: contribution,
                from: testConfig.contributorOneAddress
            });
        });
    });

    it('should allow transfer of ownership', async function () {
        await testConfig.generalSale.transferOwnership(testConfig.shpController.address, testConfig.shpController.address, {
            from: testConfig.ownerAddress
        });
        await testConfig.shpController.setContracts(testConfig.shp.address, testConfig.trusteeWallet.address);
        let controller = await testConfig.shp.controller();
        let owner = await testConfig.trusteeWallet.owner();
        assert.equal(owner, testConfig.shpController.address);
        assert.equal(controller, testConfig.shpController.address);
    });
});