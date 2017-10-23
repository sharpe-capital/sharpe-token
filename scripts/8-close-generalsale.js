var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.closeGeneralSale();
    console.log("GENERAL SALE HAS BEEN CLOSED");
}