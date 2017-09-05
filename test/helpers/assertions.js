function round(value, multiplier) {
    if(typeof(value) != 'number') {
        value = Number(value);
    }
    let rounded = Math.round(value * multiplier) / multiplier;
    return rounded;
}

function roundFromWei(value, multiplier) {
    if(!multiplier) {
        multiplier = 1;
    }
    return round(web3.fromWei(value), multiplier);
}

function getRoundedBalance(balanceType, address, multiplier) {
    let balance = web3.eth.getBalance(address).toNumber();
    //console.log(balanceType + ": " + balance);
    return roundFromWei(balance, multiplier);
}

async function retrieveAddressBalance(balanceType, address) {
    let balance = await shp.balanceOf(address);
    // console.log(balanceType + ": " + balance);
    return balance;
}

let etherEscrowAddress;
let contributionAddress;
let contributorOneAddress;
let contributorTwoAddress;
let reserveAddress;
let foundersAddress;
let masterAddress;
let shp;

module.exports = {
    initialize: function(
        _etherEscrowAddress,
        _contributionAddress,
        _contributorOneAddress,
        _contributorTwoAddress,
        _reserveAddress,
        _foundersAddress,
        _shp) {
            etherEscrowAddress = _etherEscrowAddress;
            contributionAddress = _contributionAddress;
            contributorOneAddress = _contributorOneAddress;
            contributorTwoAddress = _contributorTwoAddress;
            reserveAddress = _reserveAddress;
            foundersAddress = _foundersAddress;
            shp = _shp;
    },
    ether: function(balances) {
            let etherEscrowBalance = getRoundedBalance("etherEscrowBalance", etherEscrowAddress, balances.etherEscrowBalance % 1 == 0 ? 1: 10);
            let contributionBalance = getRoundedBalance("contributionBalance", contributionAddress, balances.contributionBalance % 1 == 0 ? 1: 10);
            let contributorOneBalance = getRoundedBalance("contributorOneBalance", contributorOneAddress, balances.contributorOneBalance % 1 == 0 ? 1: 10);
            let contributorTwoBalance = getRoundedBalance("contributorTwoBalance", contributorTwoAddress, balances.contributorTwoBalance % 1 == 0 ? 1: 10);
            let reserveBalance = getRoundedBalance("reserveBalance", reserveAddress, balances.reserveBalance % 1 == 0 ? 1: 10);
            let foundersBalance = getRoundedBalance("foundersBalance", foundersAddress, balances.foundersBalance % 1 == 0 ? 1: 10);

            assert.equal(etherEscrowBalance, balances.etherEscrowBalance);
            assert.equal(contributionBalance, balances.contributionBalance);
            assert.equal(contributorOneBalance, balances.contributorOneBalance);
            assert.equal(contributorTwoBalance, balances.contributorTwoBalance);
            assert.equal(reserveBalance, balances.reserveBalance);
            assert.equal(foundersBalance, balances.foundersBalance);
    },
    SHP: async function(balances) {
        
            let etherEscrowBalance = await retrieveAddressBalance("shpEscrowBalance", etherEscrowAddress);
            let contributionBalance = await retrieveAddressBalance("shpContributionBalance", contributionAddress);
            let contributorOneBalance = await retrieveAddressBalance("shpContributorOneBalance", contributorOneAddress);
            let contributorTwoBalance = await retrieveAddressBalance("shpContributorTwoBalance", contributorTwoAddress);
            let reserveBalance = await retrieveAddressBalance("shpReserveBalance", reserveAddress);
            let foundersBalance = await retrieveAddressBalance("shpFoundersBalance", foundersAddress);

            assert.equal(roundFromWei(etherEscrowBalance), balances.etherEscrowBalance);
            assert.equal(roundFromWei(contributionBalance), balances.contributionBalance);
            assert.equal(roundFromWei(contributorOneBalance), balances.contributorOneBalance);
            assert.equal(roundFromWei(contributorTwoBalance), balances.contributorTwoBalance);
            assert.equal(roundFromWei(reserveBalance), balances.reserveBalance);
            assert.equal(roundFromWei(foundersBalance), balances.foundersBalance);
    },
    cleanState: async function(presale) {
        ether({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await SHP({
            etherEscrowBalance: 0,
            contributionBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0
        });

        let preSaleEtherPaid = (await presale.preSaleEtherPaid()).toNumber();
        // console.log("preSaleEtherPaid: " + preSaleEtherPaid);
        assert.equal(preSaleEtherPaid, web3.toWei(0));

        let gracePeriodEtherPaid = (await presale.gracePeriodEtherPaid()).toNumber();
        // console.log("gracePeriodEtherPaid: " + gracePeriodEtherPaid);
        assert.equal(gracePeriodEtherPaid, web3.toWei(0));
    },
    expectedInitialisation: async function(presale, wallets, initValues) {
        const contributionAddr = await presale.contributionAddress();
        const etherEscrowAddr = await presale.etherEscrowAddress();
        const foundersAddr = await presale.founderAddress();
        const reserveAddr = await presale.reserveAddress();
        
        const contributionPaused = await presale.paused();
        const gracePeriod = await presale.gracePeriod();
        const actualPreSaleCap = (await presale.preSaleCap()).toNumber();

        assert.equal(contributionAddr, presale.address);
        assert.equal(etherEscrowAddr, wallets.etherEscrowWallet.address);
        assert.equal(foundersAddr, wallets.foundersWallet.address);
        assert.equal(reserveAddr, wallets.reserveWallet.address);
        
        // console.log("actualPreSaleCap: " + actualPreSaleCap);
        assert.equal(actualPreSaleCap, initValues.preSaleCap);

        let actualMinPresaleContributionEther = (await presale.minPresaleContributionEther()).toNumber();
        // console.log("actualMinPresaleContributionEther: " + actualMinPresaleContributionEther);
        assert.equal(initValues.minPresaleContributionEther, actualMinPresaleContributionEther);
    
        let actualMaxPresaleContributionEther = (await presale.maxPresaleContributionEther()).toNumber();
        // console.log("actualMaxPresaleContributionEther: " + actualMaxPresaleContributionEther);
        assert.equal(initValues.maxPresaleContributionEther, actualMaxPresaleContributionEther);

        let actualFirstTierDiscountUpperLimitEther = (await presale.firstTierDiscountUpperLimitEther()).toNumber();
        // console.log("actualFirstTierDiscountUpperLimitEther: " + actualFirstTierDiscountUpperLimitEther);
        assert.equal(initValues.firstTierDiscountUpperLimitEther, actualFirstTierDiscountUpperLimitEther);
    
        let actualSecondTierDiscountUpperLimitEther = (await presale.secondTierDiscountUpperLimitEther()).toNumber();
        // console.log("actualSecondTierDiscountUpperLimitEther: " + actualSecondTierDiscountUpperLimitEther);
        assert.equal(initValues.secondTierDiscountUpperLimitEther, actualSecondTierDiscountUpperLimitEther);

        let actualThirdTierDiscountUpperLimitEther = (await presale.thirdTierDiscountUpperLimitEther()).toNumber();
        // console.log("actualThirdTierDiscountUpperLimitEther: " + actualThirdTierDiscountUpperLimitEther);
        assert.equal(initValues.thirdTierDiscountUpperLimitEther, actualThirdTierDiscountUpperLimitEther);

        // console.log("contributionPaused: " + contributionPaused);
        assert.equal(false, contributionPaused);

        // console.log("gracePeriod: " + gracePeriod);
        assert.equal(false, gracePeriod);
    }
};