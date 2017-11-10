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
    // console.log(balanceType + ": " + balance);
    return roundFromWei(balance, multiplier);
}

async function retrieveAddressBalance(balanceType, address) {
    let balance = await shp.balanceOf(address);
    // console.log(balanceType + ": " + balance);
    return balance;
}

let etherEscrowAddress;
let crowdsaleAddress;
let contributorOneAddress;
let contributorTwoAddress;
let reserveAddress;
let foundersAddress;
let trusteeAddress;
let bountyAddress;
let masterAddress;
let shp;

module.exports = {
    initialize: function(
        _etherEscrowAddress,
        _crowdsaleAddress,
        _contributorOneAddress,
        _contributorTwoAddress,
        _reserveAddress,
        _foundersAddress,
        _trusteeAddress,
        _bountyAddress,
        _masterAddress,
        _shp) {
            etherEscrowAddress = _etherEscrowAddress;
            crowdsaleAddress = _crowdsaleAddress;
            contributorOneAddress = _contributorOneAddress;
            contributorTwoAddress = _contributorTwoAddress;
            reserveAddress = _reserveAddress;
            foundersAddress = _foundersAddress;
            trusteeAddress = _trusteeAddress;
            bountyAddress = _bountyAddress;
            masterAddress = _masterAddress;
            shp = _shp;
    },
    ether: function(balances) {
            let etherEscrowBalance = getRoundedBalance("etherEscrowBalance", etherEscrowAddress, balances.etherEscrowBalance % 1 == 0 ? 1: 10);
            let sharpeCrowdsaleBalance = getRoundedBalance("sharpeCrowdsaleBalance", crowdsaleAddress, balances.sharpeCrowdsaleBalance % 1 == 0 ? 1: 10);
            let contributorOneBalance = getRoundedBalance("contributorOneBalance", contributorOneAddress, balances.contributorOneBalance % 1 == 0 ? 1: 10);
            let contributorTwoBalance = getRoundedBalance("contributorTwoBalance", contributorTwoAddress, balances.contributorTwoBalance % 1 == 0 ? 1: 10);
            let reserveBalance = getRoundedBalance("reserveBalance", reserveAddress, balances.reserveBalance % 1 == 0 ? 1: 10);
            let foundersBalance = getRoundedBalance("foundersBalance", foundersAddress, balances.foundersBalance % 1 == 0 ? 1: 10);

            assert.equal(etherEscrowBalance, balances.etherEscrowBalance);
            assert.equal(sharpeCrowdsaleBalance, balances.sharpeCrowdsaleBalance);
            assert.equal(contributorOneBalance, balances.contributorOneBalance);
            assert.equal(contributorTwoBalance, balances.contributorTwoBalance);
            assert.equal(reserveBalance, balances.reserveBalance);
            assert.equal(foundersBalance, balances.foundersBalance);
    },
    SHP: async function(balances) {
        
            let etherEscrowBalance = await retrieveAddressBalance("shpEscrowBalance", etherEscrowAddress);
            let sharpeCrowdsaleBalance = await retrieveAddressBalance("sharpeCrowdsaleBalance", crowdsaleAddress);
            let contributorOneBalance = await retrieveAddressBalance("shpContributorOneBalance", contributorOneAddress);
            let contributorTwoBalance = await retrieveAddressBalance("shpContributorTwoBalance", contributorTwoAddress);
            let reserveBalance = await retrieveAddressBalance("shpReserveBalance", reserveAddress);
            let foundersBalance = await retrieveAddressBalance("shpFoundersBalance", foundersAddress);
            let trusteeBalance = await retrieveAddressBalance("shpTrusteeBalance", trusteeAddress);
            let bountyBalance = await retrieveAddressBalance("shpBountyBalance", bountyAddress);

            assert.equal(roundFromWei(etherEscrowBalance), balances.etherEscrowBalance);
            assert.equal(roundFromWei(sharpeCrowdsaleBalance), balances.sharpeCrowdsaleBalance);
            assert.equal(roundFromWei(contributorOneBalance), balances.contributorOneBalance);
            assert.equal(roundFromWei(contributorTwoBalance), balances.contributorTwoBalance);
            assert.equal(roundFromWei(reserveBalance), balances.reserveBalance);
            assert.equal(roundFromWei(foundersBalance), balances.foundersBalance);
            assert.equal(roundFromWei(trusteeBalance), balances.trusteeBalance);
            assert.equal(roundFromWei(bountyBalance), balances.bountyBalance);
    },
    cleanState: async function(presale) {
        ether({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0
        });

        let preSaleEtherPaid = (await presale.preSaleEtherPaid()).toNumber();
        // console.log("preSaleEtherPaid: " + preSaleEtherPaid);
        assert.equal(preSaleEtherPaid, web3.toWei(0));
    },
    expectedInitialisation: async function(presale, wallets, initValues) {
        const presaleAddr = await presale.crowdsaleAddress();
        const etherEscrowAddr = await presale.etherEscrowAddress();
        
        const contributionPaused = await presale.paused();
        const actualPreSaleCap = (await presale.preSaleCap()).toNumber();

        assert.equal(presaleAddr, presale.address);
        assert.equal(etherEscrowAddr, wallets.etherEscrowWallet.address);
        
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
        assert.equal(true, contributionPaused);
    },

    cleanStateGeneral: async function(generalSale) {
        ether({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0
        });
        await SHP({
            etherEscrowBalance: 0,
            sharpeCrowdsaleBalance: 0,
            contributorOneBalance: 0,
            contributorTwoBalance: 0,
            reserveBalance: 0,
            foundersBalance: 0
        });

        let totalEtherPaid = (await presale.totalEtherPaid()).toNumber();
        assert.equal(totalEtherPaid, web3.toWei(0));
    },
    expectedInitialisationGeneral: async function(generalSale, wallets, initValues) {
        const saleAddr = await generalSale.saleAddress();
        const etherEscrowAddr = await generalSale.etherEscrowAddress();
        
        const contributionPaused = await generalSale.paused();

        assert.equal(saleAddr, generalSale.address);
        assert.equal(etherEscrowAddr, wallets.etherEscrowWallet.address);

        let actualMinContributionInWei = (await generalSale.minContributionInWei()).toNumber();
        assert.equal(initValues.minContributionInWei, actualMinContributionInWei);
        assert.equal(true, contributionPaused);
    },
    roundFromWei: roundFromWei
};