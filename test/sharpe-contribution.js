const SharpeContribution = artifacts.require("SharpeContribution");
const SharpeToken = artifacts.require("SharpeToken");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const assertFail = require("./helpers/assertFail");
const assertBalances = require("./helpers/assertBalances");

contract("SharpeContribution", function(accounts) {

    console.log('Logging out all of the accounts for reference...');
    accounts.forEach(acc => console.log(acc));

    const contributorOneAddress = accounts[1];
    const contributorTwoAddress = accounts[2];
    const escrowSignAddress = accounts[3];
    const reserveSignAddress = accounts[4];
    const foundersSignAddress = accounts[5];

    let etherEscrowWallet;
    let foundersWallet;
    let reserveWallet;
    let sharpeContribution;
    let miniMeTokenFactory;
    let shp;
    let contributionAddress;
    let etherEscrowAddress;
    let foundersAddress;
    let reserveAddress;

    beforeEach(async function() {

        sharpeContribution = await SharpeContribution.new();
        shp = await SharpeToken.new("SHP");
        
        shp.changeOwner(sharpeContribution.address);

        etherEscrowWallet = await MultiSigWallet.new([escrowSignAddress], 1);
        foundersWallet = await MultiSigWallet.new([foundersSignAddress], 1);
        reserveWallet = await MultiSigWallet.new([reserveSignAddress], 1);
        contributionAddress = sharpeContribution.address;
        etherEscrowAddress = etherEscrowWallet.address;
        foundersAddress = foundersWallet.address;
        reserveAddress = reserveWallet.address;

        assertBalances.initialize(
            etherEscrowAddress, 
            contributionAddress, 
            contributorOneAddress, 
            contributorTwoAddress, 
            reserveAddress, 
            foundersAddress,
            shp);

        await sharpeContribution.initialize(
            etherEscrowWallet.address, 
            reserveWallet.address, 
            foundersWallet.address, 
            sharpeContribution.address,
            shp.address);
    });

    it('should have correct addresses and balances', async function() {

        const contributionAddr = await sharpeContribution.contributionAddress();
        const etherEscrowAddr = await sharpeContribution.etherEscrowAddress();
        const foundersAddr = await sharpeContribution.founderAddress();
        const reserveAddr = await sharpeContribution.reserveAddress();

        assert.equal(contributionAddr, sharpeContribution.address);
        assert.equal(etherEscrowAddr, etherEscrowWallet.address);
        assert.equal(foundersAddr, foundersWallet.address);
        assert.equal(reserveAddr, reserveWallet.address);

        assertBalances.ether(0, 0, 100, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should not accept contributions from contribution address', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: sharpeContribution.address
            });
        });
        assertBalances.ether(0, 0, 100, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should not accept contributions from ether escrow address', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: etherEscrowWallet.address
            });
        });
        assertBalances.ether(0, 0, 100, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should not accept contributions from founder address', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: foundersWallet.address
            });
        });
        assertBalances.ether(0, 0, 100, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should not accept contributions from reserve address', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(1), 
                gas: 300000, 
                gasPrice: "20000000000", 
                from: reserveWallet.address
            });
        });
        assertBalances.ether(0, 0, 100, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should prevent 0 ETH contributions', async function() {
        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: 0,
                gas: 300000, 
                gasPrice: "20000000000", 
                from: contributorOneAddress
            });
        });
        assertBalances.ether(0, 0, 100, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should accept Ether from contributor account and generate SHP', async function() {
        await sharpeContribution.sendTransaction({
            value: web3.toWei(10),
            gas: 300000, 
            gasPrice: "20000000000", 
            from: contributorOneAddress
        });
        assertBalances.ether(10, 0, 90, 100, 0, 0);
        await assertBalances.SHP(0, 0, 20000, 0, 20000, 10000);
    });

    it('should not allow calling of isContract externally', async function() {
        await assertFail(async function() {
            await sharpeContribution.isContract(contributionAddress);
        });
        assertBalances.ether(0, 0, 90, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should not allow calling of safeCaller externally', async function() {
        await assertFail(async function() {
            await sharpeContribution.safeCaller(contributionAddress);
        });
        assertBalances.ether(0, 0, 90, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should not allow calling of getBlockNumber externally', async function() {
        await assertFail(async function() {
            await sharpeContribution.getBlockNumber();
        });
        assertBalances.ether(0, 0, 90, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should not allow calling of doBuy externally', async function() {
        await assertFail(async function() {
            await sharpeContribution.doBuy(contributorTwoAddress, 1);
        });
        assertBalances.ether(0, 0, 90, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should not allow calling of proxyPayment externally', async function() {
        await assertFail(async function() {
            await sharpeContribution.proxyPayment(contributorTwoAddress);
        });
        assertBalances.ether(0, 0, 90, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);
    });

    it('should block contributions when paused & accept when resumed', async function() {

        await sharpeContribution.pauseContribution();

        await assertFail(async function() {
            await sharpeContribution.sendTransaction({
                value: web3.toWei(10),
                gas: 300000, 
                gasPrice: "20000000000", 
                from: contributorOneAddress
            });
        });
        assertBalances.ether(0, 0, 90, 100, 0, 0);
        await assertBalances.SHP(0, 0, 0, 0, 0, 0);

        await sharpeContribution.resumeContribution();

        await sharpeContribution.sendTransaction({
            value: web3.toWei(10),
            gas: 300000, 
            gasPrice: "20000000000", 
            from: contributorOneAddress
        });
        assertBalances.ether(10, 0, 80, 100, 0, 0);
        await assertBalances.SHP(0, 0, 20000, 0, 20000, 10000);
    });

    // TODO - there will be a known address that must make the first contribution...
    // After which, all other contributions will be allowed (for a fixed time period)
    it('should only allow master address to start contribution phase', async function() {});
    it('should open contributions for everyone after known address is used', async function() {});
    it('should not allow any more contributions from master address after used to start contribution phase', async function(){});
    it('should not allow pausing when not owner of contract', async function() {});
    it('should not allow resuming when not owner of contract', async function() {});
    it('should not allow contributions when contract is not initialized', async function() {});
    it('should only allow the owner of the SharpeToken contract to mint SHP tokens', async function() {});

    // Limits
    it('should reject contributions greater than the maximum ETH deposit', async function() {});
    it('should reject contributions if SHP would exceed max supply limit', async function() {});

    // Vesting - reserve
    it('should reject transfer of SHP from reserve account before 12 month vesting period', async function() {});
    it('should allow transfer of SHP from reserve account after 12 month vesting period', async function() {});
    it('should allow reserve SHP to be transferred with multiple signatures', async function() {});
    it('should reject reserve SHP transfer without multiple signatures', async function() {});

    // Vesting - founders
    it('should reject transfer of founders SHP tokens before 6 month vesting period', async function() {});
    it('should allow transfer of 25% of founders SHP tokens after 6 month vesting period', async function() {});
    it('should reject transfer of 75% of founders SHP tokens before 12 month vesting period', async function() {});
    it('should allow transfer of 75% of founders SHP tokens after 12 month vesting period', async function() {});
    it('should allow founders SHP to be transferred with multiple signatures', async function() {});
    it('should reject founders SHP transfer without multiple signatures', async function() {});

    // Vesting - contributors
    it('should reject transfer of contributors SHP tokens before contribution period ends', async function() {});
    it('should allow transfer of contributors SHP tokens after contribution period ends', async function() {});

    it('should allow ETH to be transferred after contribution period closes', async function() {});
    it('should reject ETH transfer before contribution period closes', async function() {});
    it('should allow ETH to be transferred with multiple signatures', async function() {});
    it('should reject ETH transfer without multiple signatures', async function() {});
});