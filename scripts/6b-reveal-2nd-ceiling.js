var sc = require('./script')
const ceilingsJSON = require('./ceilings.json');

module.exports = async function(callback) {
    await sc.initialize();
    await sc.revealCeiling(ceilingsJSON.second); 
    console.log("SECOND CEILING HAS BEEN REVEALED");
}