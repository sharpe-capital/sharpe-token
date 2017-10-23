var sc = require('./script');
var whitelistItems = [{address: "0xBd52e10fa8838E6CecF16d279f700eB218aBE199", value: web3.toWei(2)}];

module.exports = async function(callback) {
    await sc.initialize();
    await sc.whitleListContributor(whitelistItems);
    console.log("WHITELIST HAS BEEN UPDATED");
}