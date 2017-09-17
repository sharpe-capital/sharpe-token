const DynamicCeiling = artifacts.require("DynamicCeiling");
const assertFail = require("./helpers/assertFail");

contract("DynamicCeiling", function (accounts) {
    const ownerAddress = accounts[0];
    const saleAddress = accounts[2];
    const randomAddress = accounts[4];

    let dynamicCeiling;

    let hash1;
    let hash2;
    let hash3;
    let hash4;
    let hash5;
    // let hashes = [];

    const hashes = [];
    const ceilings = [
        [web3.toWei(1000), 30, 10 ** 12],
        [web3.toWei(21000), 30, 10 ** 12],
        [web3.toWei(61000), 30, 10 ** 12],
    ];



    before(async function () {

        dynamicCeiling = await DynamicCeiling.new(ownerAddress, saleAddress);

        let i = 0;
        for (let c of ceilings) {
            const h = await dynamicCeiling.calculateHash(
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
        console.log("HASHES", hashes);
    });

    it('should not allow non-owner to set the ceiliengs', async function () {
        await assertFail(async function () {
            await dynamicCeiling.setHiddenCeilings(hashes, {
                from: randomAddress
            });
        });
        assert.equal(await dynamicCeiling.nCeilings(), 0);
    });
    it('should not allow non-sale address to call available amount function', async function () {
        await assertFail(async function () {
            await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(5), {
                from: randomAddress
            });
        });
    });
    it('checks available amount to collect is 0 if no ceiliengs are set', async function () {
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(0, { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(10), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(15), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(20), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(30), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(55), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(676), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(5555), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(10 ** 8), { from: saleAddress }), 0);

        assert.equal(await dynamicCeiling.currentIndex(), 0);
    });

    it('should allow owner to set the ceiliengs', async function () {
        await dynamicCeiling.setHiddenCeilings(hashes);
        assert.equal(await dynamicCeiling.nCeilings(), 10);
    });

    it('checks available amount to collect is 0 if no ceilieng is revelead', async function () {
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(0, { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(10), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(15), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(20), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(30), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(55), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(676), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(5555), { from: saleAddress }), 0);
        assert.equal(await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(10 ** 8), { from: saleAddress }), 0);

        assert.equal(await dynamicCeiling.currentIndex(), 0);
    });

    it("should not reveals ceiling with incorrect data", async function () {
        await assertFail(async function () {
            await dynamicCeiling.revealCeiling(
                ceilings[0][0],
                ceilings[0][1],
                ceilings[0][2],
                false,
                web3.sha3("random-inccorect-salt"));
        });

        assert.equal(await dynamicCeiling.revealedCeilings(), 0);
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '0');
        assert.equal(await dynamicCeiling.allRevealed(), false);
    });

    it("should reveal the 1st ceiling", async function () {
        await dynamicCeiling.revealCeiling(
            ceilings[0][0],
            ceilings[0][1],
            ceilings[0][2],
            false,
            web3.sha3("pwd0"));

        assert.equal(await dynamicCeiling.revealedCeilings(), 1);
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '0');
        assert.equal(await dynamicCeiling.allRevealed(), false);
    });

    it("should return the right amounts when first ceiling is enabled", async function() {
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '0');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(0, { from: saleAddress })).toFixed(), '33333333333333333333');

        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(10), { from: saleAddress })).toFixed(), '33000000000000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(15), { from: saleAddress })).toFixed(), '32833333333333333333');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(20), { from: saleAddress })).toFixed(), '32666666666666666666');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(30), { from: saleAddress })).toFixed(), '32333333333333333333');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(55), { from: saleAddress })).toFixed(), '31500000000000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(676), { from: saleAddress })).toFixed(), '10800000000000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(999), { from: saleAddress })).toFixed(), '33333333333333333');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('999999999998999999999', { from: saleAddress })).toFixed(), '1000000001');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('999999999999000000000', { from: saleAddress })).toFixed(), '1000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('999999999999999999999', { from: saleAddress })).toFixed(), '1');

        await dynamicCeiling.avialableAmountToCollect(ceilings[0][0], { from: saleAddress });
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '0');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(ceilings[0][0], { from: saleAddress })).toFixed(), '0');
    });

        it("Reveals 2nd curve", async function() {
        await dynamicCeiling.revealCeiling(
            ceilings[1][0],
            ceilings[1][1],
            ceilings[1][2],
            false,
            web3.sha3("pwd1"));

        assert.equal(await dynamicCeiling.revealedCeilings(), 2);
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '0');
        assert.equal(await dynamicCeiling.allRevealed(), false);
    });

    it("Checks avialableAmountToCollect after 2nd curve is revealed", async function() {
        await dynamicCeiling.avialableAmountToCollect(ceilings[0][0],{ from: saleAddress });
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '1');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(ceilings[0][0], { from: saleAddress })).toFixed(), '666666666666666666666')
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(1010), { from: saleAddress })).toFixed(), '666333333333333333333');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(1015), { from: saleAddress })).toFixed(), '666166666666666666666');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(1020), { from: saleAddress })).toFixed(), '666000000000000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(1030), { from: saleAddress })).toFixed(), '665666666666666666666');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(1055), { from: saleAddress })).toFixed(), '664833333333333333333');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(10676), { from: saleAddress })).toFixed(), '344133333333333333333');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(10999), { from: saleAddress })).toFixed(), '333366666666666666666');

        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('20999999999998999999999', { from: saleAddress })).toFixed(), '1000000001');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('20999999999999000000000', { from: saleAddress })).toFixed(), '1000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('20999999999999999999999', { from: saleAddress })).toFixed(), '1');

        await dynamicCeiling.avialableAmountToCollect(ceilings[1][0], { from: saleAddress });
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '1');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(ceilings[1][0], { from: saleAddress })).toFixed(), '0');
    });

    it("Reveals last curve", async function() {
        await dynamicCeiling.revealCeiling(
            ceilings[2][0],
            ceilings[2][1],
            ceilings[2][2],
            true,
            web3.sha3("pwd2"));

        assert.equal(await dynamicCeiling.revealedCeilings(), 3);
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '1');
        assert.equal(await dynamicCeiling.allRevealed(), true);
    });

    it("Checks avialableAmountToCollect after 3rd curve is revealed", async function() {
        await dynamicCeiling.avialableAmountToCollect(ceilings[1][0],{ from: saleAddress });
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '2');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(ceilings[1][0],{ from: saleAddress })).toFixed(), '1333333333333333333333');

        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(21010), { from: saleAddress })).toFixed(), '1333000000000000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(21015), { from: saleAddress })).toFixed(), '1332833333333333333333');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(21020), { from: saleAddress })).toFixed(), '1332666666666666666666');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(21030), { from: saleAddress })).toFixed(), '1332333333333333333333');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(21055), { from: saleAddress })).toFixed(), '1331500000000000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(21676), { from: saleAddress })).toFixed(), '1310800000000000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(web3.toWei(21999), { from: saleAddress })).toFixed(), '1300033333333333333333');

        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('60999999999998999999999', { from: saleAddress })).toFixed(), '1000000001');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('60999999999999000000000', { from: saleAddress })).toFixed(), '1000000000');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call('60999999999999999999999', { from: saleAddress })).toFixed(), '1');

        await dynamicCeiling.avialableAmountToCollect(ceilings[2][0], { from: saleAddress });
        assert.equal((await dynamicCeiling.currentIndex()).toFixed(), '2');
        assert.equal((await dynamicCeiling.avialableAmountToCollect.call(ceilings[2][0], { from: saleAddress })).toFixed(), '0');
    });


    it("Deploys dynamicCeiling", async function() {
        dynamicCeiling = await DynamicCeiling.new(accounts[0], accounts[0]);

        assert.equal(await dynamicCeiling.currentIndex(), 0);
    });

    it("Sets the ceilings", async function() {
        await dynamicCeiling.setHiddenCeilings(hashes);
        assert.equal(await dynamicCeiling.nCeilings(), 10);
    });

    it("Reveals multiple ceilings", async function() {
        await dynamicCeiling.revealMulti(
            [
                ceilings[0][0],
                ceilings[1][0],
                ceilings[2][0],
            ],
            [
                ceilings[0][1],
                ceilings[1][1],
                ceilings[2][1],
            ],
            [
                ceilings[0][2],
                ceilings[1][2],
                ceilings[2][2],
            ],
            [
                false,
                false,
                true,
            ],
            [
                web3.sha3("pwd0"),
                web3.sha3("pwd1"),
                web3.sha3("pwd2"),
            ]
        );

        assert.equal(await dynamicCeiling.currentIndex(), 0);
        assert.equal(await dynamicCeiling.revealedCeilings(), 3);
        assert.equal(await dynamicCeiling.allRevealed(), true);
    });


});