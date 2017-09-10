const AffiliateUtility = artifacts.require("./AffiliateUtility");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(AffiliateUtility);
};

