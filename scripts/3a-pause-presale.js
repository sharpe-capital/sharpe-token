var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.pausePresale();
    console.log("PRESLAE HAS BEEN PAUSED.");  
}