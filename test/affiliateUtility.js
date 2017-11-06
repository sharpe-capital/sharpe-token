const AffiliateUtility = artifacts.require("AffiliateUtility");
const assertFail = require("./helpers/assertFail");
const time = require("./helpers/time");

contract("AffiliateUtility", function(accounts) {
    const ownerAddress = accounts[0];
    const affiliateOne = accounts[2];
    const notAffiliated = accounts[4];
    const investor = accounts[5];

    let affiliateUtility;

    const getTiers = function(ethRate) {
        const twoMin = web3.toWei(1) * (20000 / ethRate);
        const threeMin = web3.toWei(1) * (50000 / ethRate);
        return {
            twoMin,
            threeMin
        };
    }

    before(async function() {
        const tiers = getTiers(300);
        affiliateUtility = await AffiliateUtility.new(tiers.twoMin, tiers.threeMin);
        let beforeWhitelistPeriod = new Date(2017, 10, 9, 9, 0, 0, 0).getTime();
        await time.increaseTime(beforeWhitelistPeriod);
    });

    it('should not allow non-owner to set the tiers', async function() {
        await assertFail(async function() {
            const tiers = getTiers(350);
            await affiliateUtility.setTiers(tiers.twoMin, tiers.threeMin, {
                from: notAffiliated
            });
        });
    });

    it('should allow owner to set the tiers', async function() {
        const tiers = getTiers(350);
        await affiliateUtility.setTiers(tiers.twoMin, tiers.threeMin, {
            from: ownerAddress
        });

        const tierTwoMin = await affiliateUtility.tierTwoMin();
        const tierThreeMin = await affiliateUtility.tierThreeMin();

        assert.equal(tierTwoMin, tiers.twoMin);
        assert.equal(tierThreeMin, tiers.threeMin);
    });

    it('should not allow non-owner to add new affiliate', async function() {
        await assertFail(async function() {
            await affiliateUtility.addAffiliate(investor, affiliateOne, {
                from: notAffiliated
            });
        });
    });

    it('should allow owner to add new affiliate', async function() {
        await affiliateUtility.addAffiliate(investor, affiliateOne, {
            from: ownerAddress
        });
        let affiliate = await affiliateUtility.getAffiliate.call(investor, {
            from: ownerAddress
        });

        assert.equal(affiliate, affiliateOne);
    });

    it('should not count an address as affiliate if not whitelisted', async function() {
        const affiliate = await affiliateUtility.getAffiliate.call(notAffiliated, {
            from: ownerAddress
        });

        assert.equal(affiliate, '0x0000000000000000000000000000000000000000');
    });

    it('should correctly calculate bonus for a Tier 1 contribution', async function() {
        const tiers = getTiers(300);
        await affiliateUtility.setTiers(tiers.twoMin, tiers.threeMin, {
            from: ownerAddress
        });
        const values = await affiliateUtility.applyAffiliate.call(investor, 2000, web3.toWei(1));
        const tier1percentage = await affiliateUtility.TIER1_PERCENT();

        assert.equal(values[0].toNumber(), 2000 * 0.01 * tier1percentage);
        assert.equal(values[1].toNumber(), 2000 * 0.01);
    });

    it('should correctly calculate bonus for a Tier 2 contribution', async function() {
        const tiers = getTiers(300);
        await affiliateUtility.setTiers(tiers.twoMin, tiers.threeMin, {
            from: ownerAddress
        });
        const values = await affiliateUtility.applyAffiliate.call(investor, 160000, 80 * web3.toWei(1));
        const tier2percentage = await affiliateUtility.TIER2_PERCENT();

        assert.equal(values[0].toNumber(), 160000 * 0.01 * tier2percentage);
        assert.equal(values[1].toNumber(), 160000 * 0.01);
    });

    it('should correctly calculate bonus for a Tier 3 contribution', async function() {
        const values = await affiliateUtility.applyAffiliate.call(investor, 400000, 200 * web3.toWei(1));
        const tier3percentage = await affiliateUtility.TIER3_PERCENT();

        assert.equal(values[0].toNumber(), 400000 * 0.01 * tier3percentage);
        assert.equal(values[1].toNumber(), 400000 * 0.01);
    });

    it('should not apply any bonus for non-affiliate address', async function() {
        const tiers = getTiers(300);
        await affiliateUtility.setTiers(tiers.twoMin, tiers.threeMin, {
            from: ownerAddress
        });
        const values = await affiliateUtility.applyAffiliate.call(notAffiliated, 400000, 200 * web3.toWei(1));

        assert.equal(values[0].toNumber(), 0);
        assert.equal(values[1].toNumber(), 0);
    });
});