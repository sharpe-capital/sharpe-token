function round(value) {
    const multiplier = 10;
    if(typeof(value) != 'number') {
        value = Number(value);
    }
    return Math.round(value * multiplier) / multiplier;
}

function roundFromWei(value) {
    return round(web3.fromWei(value));
}

function getRoundedBalance(address) {
    return roundFromWei(web3.eth.getBalance(address).toNumber());
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
        _masterAddress,
        _shp) {
            etherEscrowAddress = _etherEscrowAddress;
            contributionAddress = _contributionAddress;
            contributorOneAddress = _contributorOneAddress;
            contributorTwoAddress = _contributorTwoAddress;
            reserveAddress = _reserveAddress;
            foundersAddress = _foundersAddress;
            masterAddress = _masterAddress;
            shp = _shp;
    },
    ether: function(
        etherEscrowBalance, 
        contributionBalance, 
        contributorOneBalance, 
        contributorTwoBalance,
        reserveBalance,
        foundersBalance) {
            assert.equal(getRoundedBalance(etherEscrowAddress), etherEscrowBalance);
            assert.equal(getRoundedBalance(contributionAddress), contributionBalance);
            assert.equal(getRoundedBalance(contributorOneAddress), contributorOneBalance);
            assert.equal(getRoundedBalance(contributorTwoAddress), contributorTwoBalance);
            assert.equal(getRoundedBalance(reserveAddress), reserveBalance);
            assert.equal(getRoundedBalance(foundersAddress), foundersBalance);
    },
    SHP: async function(
        etherEscrowBalance, 
        contributionBalance, 
        contributorOneBalance, 
        contributorTwoBalance,
        reserveBalance,
        foundersBalance) {
            assert.equal(roundFromWei(await shp.balanceOf(etherEscrowAddress)), etherEscrowBalance);
            assert.equal(roundFromWei(await shp.balanceOf(contributionAddress)), contributionBalance);
            assert.equal(roundFromWei(await shp.balanceOf(contributorOneAddress)), contributorOneBalance);
            assert.equal(roundFromWei(await shp.balanceOf(contributorTwoAddress)), contributorTwoBalance);
            assert.equal(roundFromWei(await shp.balanceOf(reserveAddress)), reserveBalance);
            assert.equal(roundFromWei(await shp.balanceOf(foundersAddress)), foundersBalance);
    }
};