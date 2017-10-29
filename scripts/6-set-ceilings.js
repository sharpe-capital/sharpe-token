var sc = require('./script')
const ceilingsJSON = require('./ceilings.json');

module.exports = async function(callback) {
    var ceilings = [ceilingsJSON.first, ceilingsJSON.second, ceilingsJSON.third];
    var randomHashes = [ceilingsJSON.random1, ceilingsJSON.random2,ceilingsJSON.random3,ceilingsJSON.random4];
    
    await sc.initialize();
    await sc.setCeilings(ceilings);
    console.log("CEILINGS HAVE BEEN SET");
}