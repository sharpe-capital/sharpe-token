var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.closePresale();
    console.log("PRESALE HAS BEEN CLOSED");
}