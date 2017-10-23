var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.transferOwnershipToGeneralSale();
    console.log("OWNERSHIP HAS BEEN TRANSFERRED TO GENERAL SALE");
}