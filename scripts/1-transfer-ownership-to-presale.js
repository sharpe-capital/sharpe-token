var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.transferToPreSale();
    console.log("Ownership has been transferred to Presale");
}