const AffiliateUtility = artifacts.require("AffiliateUtility");
const assertFail = require("./helpers/assertFail");

contract("AffiliateUtility", function (accounts) {
    const ownerAddress = accounts[0];
    const affiliateOne = accounts[2];
    const notAffiliated = accounts[4];

    let affiliateUtility;

    before(async function () {
        affiliateUtility = await AffiliateUtility.new();
    });

    it('should not allow non-owner to peg the exhcahge rate', async function () {
        await assertFail(async function () {
            await affiliateUtility.pegValue(350, {
                from: notAffiliated
            });
        });
    });

    it('should allow owner to peg the exhcahge rate', async function () {
        await affiliateUtility.pegValue(350, {
            from: ownerAddress
        });
        const newValue = await affiliateUtility.etherToUSDExchangeRate();

        assert.equal(newValue, 350);
    });

    it('should not allow non-owner to add new affiliate', async function () {
        await assertFail(async function () {
            await affiliateUtility.addToWhiteList(affiliateOne, {
                from: notAffiliated
            });
        });
    });

    it('should allow owner to add new affiliate', async function () {
        await affiliateUtility.addToWhiteList(affiliateOne, {
            from: ownerAddress
        });
        const isAffiliate = await affiliateUtility.isAffiliateValid.call(affiliateOne, {
            from: ownerAddress
        });

        assert.equal(isAffiliate, true);
    });

    it('should not count an address as affiliate if not whitelisted', async function () {
        const isAffiliate = await affiliateUtility.isAffiliateValid.call(notAffiliated, {
            from: ownerAddress
        });

        assert.equal(isAffiliate, false);
    });

    it('should correctly calculate bonus for a Tier 1 contribution', async function () {
        await affiliateUtility.pegValue(300, {
            from: ownerAddress
        });
        const values = await affiliateUtility.applyAffiliate.call(affiliateOne, 2000, 1000000000000000000);
        const tier1percentage = await affiliateUtility.TIER1_PERCENT();

        assert.equal(values[0], true);
        assert.equal(values[1].toNumber(), 2000 * 0.01 * tier1percentage);
        assert.equal(values[2].toNumber(), 2000 * 0.01);
    });

    it('should correctly calculate bonus for a Tier 2 contribution', async function () {
        await affiliateUtility.pegValue(300, {
            from: ownerAddress
        });
        const values = await affiliateUtility.applyAffiliate.call(affiliateOne, 160000, 80 * 1000000000000000000);
        const tier2percentage = await affiliateUtility.TIER2_PERCENT();

        assert.equal(values[0], true);
        assert.equal(values[1].toNumber(), 160000 * 0.01 * tier2percentage);
        assert.equal(values[2].toNumber(), 160000 * 0.01);
    });

    it('should correctly calculate bonus for a Tier 3 contribution', async function () {
        const values = await affiliateUtility.applyAffiliate.call(affiliateOne, 400000, 200 * 1000000000000000000);
        const tier3percentage = await affiliateUtility.TIER3_PERCENT();

        assert.equal(values[0], true);
        assert.equal(values[1].toNumber(), 400000 * 0.01 * tier3percentage);
        assert.equal(values[2].toNumber(), 400000 * 0.01);
    });

    it('should not apply any bonus for non-affiliate address', async function () {
        await affiliateUtility.pegValue(300, {
            from: ownerAddress
        });
        const values = await affiliateUtility.applyAffiliate.call(notAffiliated, 400000, 200 * 1000000000000000000);

        assert.equal(values[0], false);
        assert.equal(values[1].toNumber(), 0);
        assert.equal(values[2].toNumber(), 0);
    });
});