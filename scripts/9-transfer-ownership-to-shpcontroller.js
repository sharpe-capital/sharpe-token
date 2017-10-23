var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.transferOwnershipToSHPController();
    console.log("OWNERSHIP HAS BEEN TRANSFERRED TO SHPCONTROLLER");
}