var sc = require('./script');
const Whitlelist = require("./whitelist.json");
const whitelistItems = Whitlelist.list;

module.exports = async function(callback) {
    await sc.initialize();
    await sc.whitleListContributor(whitelistItems);
    console.log("WHITELIST HAS BEEN UPDATED");
}