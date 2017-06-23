const SharpeContribution = artifacts.require("SharpeContribution");
const SHP = artifacts.require("SHP");
const MultiSigWallet = artifacts.require("MultiSigWallet");

contract("SharpeContribution", function(accounts) {
    
    const etherEscrowAddress = accounts[0];
    const foundersAddress = accounts[1];
    const reserveAddress = accounts[2];

    let multisigEtherEscrow;
    let multisigFounders;
    let multisigReserve;
    let miniMeTokenFactory;
    let shp;
    let sharpeContribution;

    it("Deploys all contracts", async function() {
        multisigEtherEscrow = await MultiSigWallet.new([etherEscrowAddress], 1);
        multisigFounders = await MultiSigWallet.new([foundersAddress], 1);
        multisigReserve = await MultiSigWallet.new([reserveAddress], 1);

        miniMeTokenFactory = await MiniMeTokenFactory.new();

        sgt = await SGT.new(miniMeTokenFactory.address);
        await sgt.generateTokens(addressSGTHolder, 2500);
        await sgt.generateTokens(addressStatus, 2500);

        shp = await SHP.new(miniMeTokenFactory.address);
        sharpeContribution = await SharpeContribution.new(etherEscrowAddress, reserveAddress, foundersAddress, shp);
    });

    // it("should create initial Sharpe token with expected details", async function() {

    //     const instance = await SharpeToken.deployed();
    //     const balance = await instance.getBalance.call(accounts[0]);
    //     const name = await instance.name();
    //     const decimals = await instance.decimals();
    //     const symbol = await instance.symbol();
    //     const version = await instance.version();

    //     assert.equal(balance, 10000, "10000 wasn't in the first account");
    //     assert.equal(name, "Sharpe Token", "Name was not Sharpe Token");
    //     assert.equal(decimals, 18, "Decimals was not 18");
    //     assert.equal(symbol, "SHP", "Symbol was not SHP");
    //     assert.equal(version, "v1.0", "Version was not v1.0");
    // });
});