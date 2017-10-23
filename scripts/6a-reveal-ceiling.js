var sc = require('./script')
var ceiling = [15000000000000000000, 1, 10 ** 12, "2"], isLast = true;

module.exports = async function(callback) {
    await sc.initialize();
    await sc.revealCeiling(ceiling, isLast); 
    console.log("NEXT CEILING HAS BEEN REVEALED");
}