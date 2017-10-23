var sc = require('./script')
var randomHashes = ["eweaqeqweqwewe","aweqweqweqwesd","qweqweqweads","qweqweqweas","qweqweqweahd"];
module.exports = async function(callback) {
    var ceilings = [
        [7000000000000000000, 1, 10 ** 12, "1"],
        [15000000000000000000, 1, 10 ** 12, "2"]
    ];
    await sc.initialize();
    await sc.setCeilings(ceilings, randomHashes);
    console.log("CEILINGS HAVE BEEN SET");
}