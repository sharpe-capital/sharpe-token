const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("./MiniMeToken.sol");
const GeneralSale = artifacts.require("./GeneralSale.sol");
const SHP = artifacts.require("./SHP.sol");
const SCD = artifacts.require("./SCD.sol");
const AffiliateUtility = artifacts.require("./AffiliateUtility.sol");
const DynamicCeiling = artifacts.require("./DynamicCeiling.sol");
const Presale = artifacts.require("./SHP.sol");
const SHPController = artifacts.require("./SHPController.sol");
const TokenSale = artifacts.require("./TokenSale.sol");
const Owned = artifacts.require("./Owned.sol");
const SafeMath = artifacts.require("./SafeMath.sol");
const Trustee = artifacts.require("./Trustee.sol");
const MultiSigWallet = artifacts.require("./MultiSigWallet");

const MASTER = "";
var presaleContract, generalSaleContract, affiliateUtilityContract;
var shpContract, shpControllerContract, dynamicCeilingContract;
var trusteeContract;

var preSaleAddress = "";
var generalSaleAddress = "";
var affiliateUtilityAddress = "";
var shpAddress = "";
var shpControllerAddressa = "";
var trusteeAddress = "";
var dynamicCeilingAddress = "";

//Set contract addresses
async function updateAddresses(_preSaleAddress,
    _generalSaleAddress,
    _affiliateUtilityAddress,
    _shpAddress,
    _shpControllerAddressa,
    _trusteeAddress,
    _dynamicCeilingAddress
) {

    preSaleAddress = _preSaleAddress;
    generalSaleAddress = _generalSaleAddress;
    affiliateUtilityAddress = _affiliateUtilityAddress;
    shpAddress = _shpAddress;
    shpControllerAddressa = _shpControllerAddressa;
    trusteeAddress = _trusteeAddress;
    dynamicCeilingAddress = _dynamicCeilingAddress;
    initialize();
}

// Grab instances of all contracts
async function initialize() {
    presaleContract = await Presale.at(preSaleAddress);
    generalSaleContract = await GeneralSale.at(generalSaleAddress);
    shpContract = await SHP.at(shpAddress);
    shpControllerContract = await SHPController.at(shpControllerContract);
    trusteeContract = await Trustee.at(trusteeAddress);
    dynamicCeilingContract = await DynamicCeiling.at(dynamicCeilingAddress);
}

// Change Ownerships To Presale:
async function transferToPreSale() {
    await trusteeContract.changeOwner(preSaleAddress);
    await shpContract.changeController(preSaleAddress);
    await preSaleContract.setShp(shpAddress);
}

//WhiteList Contributors 
//WhitelistItems is a json array
async function whitleListContributor(whiteListItems) {
    for (var wl of whiteListItems) {
        await preSaleContract.addToWhitelist(
            wl.address,
            wl.value, {
                from: MASTER
            }
        );
    }
}

//Add Affiliates
//addiliates is a json array of affiliates 
async function addAffilliates(affiliates) {
    for (var af of affiliates) {
        await affiliateUtilityContract.addAffiliate(af.investor, af.affiliate, {
            from: MASTER
        });
    }
}

//Resume PreSale
async function resumePresale() {
    await preSaleContract.resumeContribution({
        from: MASTER
    });
}
//Pause Presale
async function pausePresale() {
    await preSaleContract.pauseContribution({
        from: MASTER
    });
}
//Close Presale 
async function closePresale() {
    await preSaleContract.closeSale({
        from: MASTER
    });
}

//Transfer OwnerShip to General Sale
async function transferOwnershipToGeneralSale() {

    await preSaleContract.transferOwnership(generalSaleAddress, generalSaleAddress, {
        from: MASTER
    });
    await generalSaleContract.setShp(shpAddress);
}

//Set Initial Dynamic Ceilings 
async function setCeilings(ceilings, randomHashes) {
    let i = 0;
    for (let c of ceilings) {
        const h = await dynamicCeilingContract.calculateHash(
            c[0],
            c[1],
            c[2],
            i === ceilings.length - 1,
            web3.sha3(c[3]), { from: MASTER });
        hashes.push(h);
        i += 1;
    }
    // add some more random hashes to conceal the total number of ceilings
    for (; i < randomHashes.length; i += 1) {
        hashes.push(randomHashes[i]);
    }
    await dynamicCeilingContract.setHiddenCeilings(hashes, { from: MASTER });
}

//Resume PreSale
async function resumePresale() {
    await generalSaleContract.resumeContribution({
        from: MASTER
    });
}
//Pause Presale
async function pausePresale() {
    await generalSaleContract.pauseContribution({
        from: MASTER
    });
}
//Close Presale 
async function closePresale() {
    await generalSaleContract.closeSale({
        from: MASTER
    });
}

//Reveal Ceilings
async function revealCeiling(ceilieng, isLast) {
    await dynamicCeilingContract.revealCeiling(
        ceiling[0],
        ceiling[1],
        ceiling[2],
        isLast,
        web3.sha3(c[3]), { from: MASTER });
}

//Transfer Ownershipt to SHPController
async function transferOwnershipToSHPController() {
    await generalSaleContract.transferOwnership(shpControllerAddress, shpControllerAddress, {
        from: MASTER
    });
}

// Called after General Sale is closed
async function finalizeSale() {

    // Set reserver and founder tokens
    let preSaleFounderTokenCount = await presaleContract.founderTokenCount();
    let preSaleReserveTokenCount = await presaleContract.reserveTokenCount();

    let generalSaleFounderTokenCount = await generalSaleContract.founderTokenCount();
    let generalSaleReserveTokenCount = await generalSaleContract.reserveTokenCount();

    let founderTokenCount = web3.toWei(generalSaleReserveTokenCount + preSaleFounderTokenCount);
    let reserveTokenCount = web3.toWei(generalSaleReserveTokenCount + generalSaleFounderTokenCount);
    await testConfig.shpController.setTokenCounts(reserveTokenCount, founderTokenCount, {
        from: MASTER
    });

    await shpControllerContract.createVestingGrants({
        from: MASTER
    });
}
