var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.pauseGeneralSale();
    console.log("GENERAL SALE HAS BEEN PAUSED");
}