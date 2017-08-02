const TradeLedger = artifacts.require("TradeLedger");
const assertFail = require("./helpers/assertFail");

let tradeLedger;

contract("TradeLedger", function(accounts) {

    console.log('Logging out all of the accounts for reference...');
    accounts.forEach(acc => console.log(acc));

    before(async function() {
        tradeLedger = await TradeLedger.new();
    });

    after(async function() {
        tradeLedger = null;
    });

    it('should not accept Ether payments', async function() {
        await assertFail(async function() {
            await tradeLedger.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: accounts[1]
            });
        });
    });

    it('should add an account', async function() {
        await tradeLedger.addAccount("12345");
        const result = await tradeLedger.countAccounts.call();
        assert.equal(result.toNumber(), 1);
    });

    it('should get an account by ID', async function() {
        const result = await tradeLedger.getAccount.call("12345");
        assert.equal(result[0], "12345");
        assert.equal(result[1].toNumber(), 0);
        assert.equal(result[2].toNumber(), 0);
        assert.equal(result[3].toNumber(), 0);
        assert.equal(result[4].toNumber(), 0);
        assert.equal(result[5].toNumber(), 0);
    });

    it('should not allow duplicate account IDs', async function(){
        await assertFail(async function() {
            await tradeLedger.addAccount("12345");
        });
    });

    it('should add a position', async function() {
        await tradeLedger.addPosition("100", 'BASE64', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '12345');
        await tradeLedger.addPosition("101", 'BASE64', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '12345');
        const result = await tradeLedger.countPositions.call();
        assert.equal(result.toNumber(), 2);
    });

    it('should fail to get position with invalid ID', async function() {
        await assertFail(async function() {
            const result = await tradeLedger.getPosition.call("98");
        });
    });

    it('should fail to get position keys with invalid ID', async function() {
        await assertFail(async function() {
            const result = await tradeLedger.getPositionKeys.call("98");
        });
    });

    it('should fail to add position if not the account owner', async function(){
        await assertFail(async function() {
            await tradeLedger.addPosition("102", 'BASE64', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '12345', {
                from: address[1]
            });
        });
    });

    it('should not add position with missing ID', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition('', 'BASE64', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '12345');
        });
    });

    it('should not add position with missing open price', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition('102', '', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '12345');
        });
    });

    it('should not add position with missing size', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition('102', 'BASE64', 'BASE64', 'BASE64', 0, 1, '2017-01-01T11:00:00', 'BASE64', '12345');
        });
    });

    it('should not add position with missing exposure', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition('102', 'BASE64', 'BASE64', 'BASE64', 1, 0, '2017-01-01T11:00:00', 'BASE64', '12345');
        });
    });

    it('should not add position with missing open date', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition('102', 'BASE64', 'BASE64', 'BASE64', 1, 1, '', 'BASE64', '12345');
        });
    });

    it('should not add position with missing ticker', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition('102', 'BASE64', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', '', '12345');
        });
    });

    it('should not add position with missing account ID', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition('102', 'BASE64', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '');
        });
    });

    it('should add position with missing stop price', async function() {
        await tradeLedger.addPosition('102', 'BASE64', '', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '12345');
        const result = await tradeLedger.getPosition.call("102");
        assert.equal(result[0], 'BASE64');
        assert.equal(result[4], '2017-01-01T11:00:00');
    });

    it('should add position with missing limit price', async function() {
        await tradeLedger.addPosition('103', 'BASE64', 'BASE64', '', 1, 1, '2017-01-01T11:00:00', 'BASE64', '12345');
        const result = await tradeLedger.getPosition.call("103");
        assert.equal(result[0], 'BASE64');
        assert.equal(result[4], '2017-01-01T11:00:00');
    });

    it('should not allow duplicate position IDs', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition("101", 'BASE64', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '12345');
        });
    });

    it('should fail to add a position with invalid account', async function() {
        await assertFail(async function() {
            await tradeLedger.addPosition("100", 'BASE64', 'BASE64', 'BASE64', 1, 1, '2017-01-01T11:00:00', 'BASE64', '88888');
        });
    });

    it('should hide the keys at first', async function() {
        const result = await tradeLedger.getPositionKeys.call("100");
        assert.equal(result[0], 'TBC');
        assert.equal(result[1], 'TBC');
    });

    it('should fetch the position by ID', async function() {
        const result = await tradeLedger.getPosition.call("100");
        assert.equal(result[0], 'BASE64');
        assert.equal(result[1], '');
        assert.equal(result[2], 1);
        assert.equal(result[3].toNumber(), 0);
        assert.equal(result[4], '2017-01-01T11:00:00');
        assert.equal(result[5], '');
        assert.equal(result[6], 'BASE64');
    });

    it('should only allow the account owner to release encryption keys', async function() {
        await assertFail(async function() {
            await tradeLedger.releaseKeyPair('12345', 'PRIVKEY', 'PUBKEY', {
                from: accounts[1]
            });
        });
    });

    it('should fail on close position when not owner', async function() {
        await assertFail(async function() {
            await tradeLedger.closePosition('100', 'BASE64', '2017-02-01T11:00:00', {
                from: accounts[1]
            });
        });
    });

    it('should close the position', async function() {
        await tradeLedger.closePosition('100', 'BASE64', '2017-02-01T11:00:00');
        const result = await tradeLedger.getPosition.call("100");
        assert.equal(result[0], 'BASE64');
        assert.equal(result[1], 'BASE64');
        assert.equal(result[2], 1);
        assert.equal(result[3].toNumber(), 0);
        assert.equal(result[4], '2017-01-01T11:00:00');
        assert.equal(result[5], '2017-02-01T11:00:00');
        assert.equal(result[6], 'BASE64');
    });

    it('should fail on close position when already closed', async function() {
        await assertFail(async function() {
            await tradeLedger.closePosition('100', 'BASE64', '2017-02-01T11:00:00');
        });
    });

    it('should release the encryption keys for closed positions', async function() {
        await tradeLedger.releaseKeyPair('12345', 'PRIVKEY', 'PUBKEY');
        const result = await tradeLedger.getPositionKeys.call("100");
        assert.equal(result[0], 'PRIVKEY');
        assert.equal(result[1], 'PUBKEY');
        const result2 = await tradeLedger.getPositionKeys.call("101");
        assert.equal(result2[0], 'TBC');
        assert.equal(result2[1], 'TBC');
    });

    it('should fail to release the keys once already released', async function() {
        await tradeLedger.releaseKeyPair('12345', 'PRIVKEY2', 'PUBKEY2');
        const result = await tradeLedger.getPositionKeys.call("100");
        assert.equal(result[0], 'PRIVKEY');
        assert.equal(result[1], 'PUBKEY');
    });

    it('should count positions for account', async function() {
        const result = await tradeLedger.countAccountPositions.call('12345');
        assert.equal(result.toNumber(), 4);
    });

    it('should fetch all positions for account', async function() {
        const result = await tradeLedger.countAccountPositions.call('12345');
        const count = result.toNumber();
        for(let idx=0; idx<count; idx++) {
            const result = await tradeLedger.getPositionByIndex.call('12345', idx);
            assert.equal(result[0], 'BASE64');
        }
    });

    it('should fetch all position keys for account', async function() {
        // TODO - there's an improvement here, where we just store the keys once with a mapping index
    });
    it('should update P/L for a position', async function() {});
    it('should update account equity', async function() {});
    it('should fetch all equity points for account', async function() {});
});