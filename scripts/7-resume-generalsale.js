var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.resumeGeneralSale();
    console.log("GENERAL SALE HAS BEEN RESUMED");
}