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

const MASTER = "0x57a2925eee743a6f29997e65ea2948f296e84b08";

var preSaleAddress = "0xd65296442610bb0ba9e1f73bee10b0527e87990f";
var generalSaleAddress = "0x40bfe6e04f8a622b0a842016a5739489a82d2538";
var affiliateUtilityAddress = "0xd885a4b0a96aa046e34dc719bdfef2bf4b3a5948";
var shpAddress = "0x6c85185cf240ef62b0d9bc774e3e001048a4c884";
var shpControllerAddressa = "0x38a6441e796fe3ef4daa40addbc9451a8a4dc1d6";
var trusteeAddress = "0x218ab446ca6aff00a5104f61a1b2d2b917c150e8";
var dynamicCeilingAddress = "0x7630c6aff4d5566f7d6bb4d3296d8b846c91ef67";

class TokenSaleControllerScript {
    constructor() { }

    //Set contract addresses
    async updateAddresses(_preSaleAddress,
        _generalSaleAddress,
        _affiliateUtilityAddress,
        _shpAddress,
        _shpControllerAddressa,
        _trusteeAddress,
        _dynamicCeilingAddress
    ) {

        this.preSaleAddress = _preSaleAddress;
        this.generalSaleAddress = _generalSaleAddress;
        this.affiliateUtilityAddress = _affiliateUtilityAddress;
        this.shpAddress = _shpAddress;
        this.shpControllerAddressa = _shpControllerAddressa;
        this.trusteeAddress = _trusteeAddress;
        this.dynamicCeilingAddress = _dynamicCeilingAddress;
        initialize();
    }

    // Grab instances of all contracts
    async initialize() {
        this.presaleContract = await Presale.at(preSaleAddress);
        this.generalSaleContract = await GeneralSale.at(generalSaleAddress);
        this.shpContract = await SHP.at(shpAddress);
        this.shpControllerContract = await SHPController.at(shpControllerContract);
        this.trusteeContract = await Trustee.at(trusteeAddress);
        this.dynamicCeilingContract = await DynamicCeiling.at(dynamicCeilingAddress);
    }

    // Change Ownerships To Presale:
    async transferToPreSale() {
        await trusteeContract.changeOwner(preSaleAddress);
        await shpContract.changeController(preSaleAddress);
        await preSaleContract.setShp(shpAddress);
    }

    //WhiteList Contributors 
    //WhitelistItems is a json array
    async whitleListContributor(whiteListItems) {
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
    async addAffilliates(affiliates) {
        for (var af of affiliates) {
            await affiliateUtilityContract.addAffiliate(af.investor, af.affiliate, {
                from: MASTER
            });
        }
    }

    //Resume PreSale
    async resumePresale() {
        await preSaleContract.resumeContribution({
            from: MASTER
        });
    }
    //Pause Presale
    async pausePresale() {
        await preSaleContract.pauseContribution({
            from: MASTER
        });
    }
    //Close Presale 
    async closePresale() {
        await preSaleContract.closeSale({
            from: MASTER
        });
    }

    //Transfer OwnerShip to General Sale
    async transferOwnershipToGeneralSale() {

        await preSaleContract.transferOwnership(generalSaleAddress, generalSaleAddress, {
            from: MASTER
        });
        await generalSaleContract.setShp(shpAddress);
    }

    //Set Initial Dynamic Ceilings 
    async setCeilings(ceilings, randomHashes) {
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
    async resumePresale() {
        await generalSaleContract.resumeContribution({
            from: MASTER
        });
    }
    //Pause Presale
    async pausePresale() {
        await generalSaleContract.pauseContribution({
            from: MASTER
        });
    }
    //Close Presale 
    async closePresale() {
        await generalSaleContract.closeSale({
            from: MASTER
        });
    }

    //Reveal Ceilings
    async revealCeiling(ceilieng, isLast) {
        await dynamicCeilingContract.revealCeiling(
            ceiling[0],
            ceiling[1],
            ceiling[2],
            isLast,
            web3.sha3(c[3]), { from: MASTER });
    }

    //Transfer Ownershipt to SHPController
    async transferOwnershipToSHPController() {
        await generalSaleContract.transferOwnership(shpControllerAddress, shpControllerAddress, {
            from: MASTER
        });
    }

    // Called after General Sale is closed
    async finalizeSale() {

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

}
module.exports = new TokenSaleControllerScript(callback);
