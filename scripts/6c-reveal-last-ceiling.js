var sc = require('./script')
const ceilingsJSON = require('./ceilings.json');

module.exports = async function(callback) {
    await sc.initialize();
    await sc.revealCeiling(ceilingsJSON.third); 
    console.log("THIRD CEILING HAS BEEN REVEALED");
}