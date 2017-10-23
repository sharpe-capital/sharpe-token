var sc = require('./script')

module.exports = async function(callback) {
    await sc.initialize();
    await sc.finalizeSale();
    console.log("SALE HAS BEEN FINALIZED");
    
}