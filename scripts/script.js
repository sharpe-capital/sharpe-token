let Web3 = require('web3');
var provider = new Web3.providers.HttpProvider("http://52.210.215.150:8545")
let contract = require('truffle-contract')
const web3 = new Web3();
    
const MiniMeTokenFactory = contract(require('../build/contracts/MiniMeTokenFactory'));
const MiniMeToken = contract(require('../build/contracts/MiniMeToken.json'));
const GeneralSale = contract(require('../build/contracts/SharpeCrowdsale.json'));
const SHP = contract(require('../build/contracts/SHP.json'));
const SCD = contract(require('../build/contracts/SCD.json'));
const AffiliateUtility = contract(require('../build/contracts/AffiliateUtility.json'));
const DynamicCeiling = contract(require('../build/contracts/DynamicCeiling.json'));
const Presale = contract(require('../build/contracts/SharpePresale.json'));
const SHPController = contract(require('../build/contracts/SHPController.json'));
const TokenSale = contract(require('../build/contracts/TokenSale.json'));
const Owned = contract(require('../build/contracts/Owned.json'));
const SafeMath = contract(require('../build/contracts/SafeMath.json'));
const Trustee = contract(require('../build/contracts/Trustee.json'));
const MultiSigWallet = contract(require('../build/contracts/MultiSigWallet.json'));

MiniMeTokenFactory.setProvider(provider);
MiniMeToken.setProvider(provider);
GeneralSale.setProvider(provider);
SHP.setProvider(provider);
SCD.setProvider(provider);
AffiliateUtility.setProvider(provider);
DynamicCeiling.setProvider(provider);
Presale.setProvider(provider);
SHPController.setProvider(provider);
Owned.setProvider(provider);
SafeMath.setProvider(provider);
Trustee.setProvider(provider);
MultiSigWallet.setProvider(provider);

const Config = require("./deployed_addresses.json");

const MASTER = Config.master;

const preSaleAddress = Config.preSaleAddress; ;
const generalSaleAddress = Config.generalSaleAddress;
const affiliateUtilityAddress = Config.affiliateUtilityAddress;
const shpAddress = Config.shpAddress;
const shpControllerAddress = Config.shpControllerAddress;
const trusteeAddress = Config.trusteeAddress;
const dynamicCeilingAddress = Config.dynamicCeilingAddress;

const etherPegvalue = Config.etherPegvalue;

class TokenSaleControllerScript {
    constructor() { }

    //Set contract addresses
    async updateAddresses(_preSaleAddress,
        _generalSaleAddress,
        _affiliateUtilityAddress,
        _shpAddress,
        _shpControllerAddress,
        _trusteeAddress,
        _dynamicCeilingAddress
    ) {

        this.preSaleAddress = _preSaleAddress;
        this.generalSaleAddress = _generalSaleAddress;
        this.affiliateUtilityAddress = _affiliateUtilityAddress;
        this.shpAddress = _shpAddress;
        this.shpControllerAddress = _shpControllerAddress;
        this.trusteeAddress = _trusteeAddress;
        this.dynamicCeilingAddress = _dynamicCeilingAddress;
        initialize();
    }

    // Grab instances of all contracts
    async initialize() {
        this.preSaleContract = await Presale.at(preSaleAddress);
        this.generalSaleContract = await GeneralSale.at(generalSaleAddress);
        this.shpContract = await SHP.at(shpAddress);
        this.shpControllerContract = await SHPController.at(shpControllerAddress);
        this.trusteeContract = await Trustee.at(trusteeAddress);
        this.dynamicCeilingContract = await DynamicCeiling.at(dynamicCeilingAddress);
        console.log("Init All Contracts");
    }

    // Change Ownerships To Presale:
    async transferToPreSale() {
        console.log("presale address ", preSaleAddress)
        await this.trusteeContract.changeOwner(preSaleAddress,{from: MASTER});
        console.log("ownership 1");
        await this.shpContract.changeController(preSaleAddress, {from: MASTER});
        console.log("ownership 2");
        await this.preSaleContract.setShp(shpAddress, {from: MASTER});
        console.log("ownership 3");
    }

    //WhiteList Contributors 
    //WhitelistItems is a json array
    async whitleListContributor(whiteListItems) {
        for (var wl of whiteListItems) {
            await this.preSaleContract.addToWhitelist(
                wl.address,
                web3.toWei(wl.amount/etherPegvalue), {
                    from: MASTER
                }
            );
        }
    }

    //Add Affiliates
    //addiliates is a json array of affiliates 
    async addAffilliates(affiliates) {
        for (var af of affiliates) {
            await this.affiliateUtilityContract.addAffiliate(af.investor, af.affiliate, {
                from: MASTER
            });
        }
    }

    //Resume PreSale
    async resumePresale() {
        await this.preSaleContract.resumeContribution({
            from: MASTER
        });
    }
    //Pause Presale
    async pausePresale() {
        await this.preSaleContract.pauseContribution({
            from: MASTER
        });
    }
    //Close Presale 
    async closePresale() {
        await this.preSaleContract.closeSale({
            from: MASTER
        });
    }

    //Transfer OwnerShip to General Sale
    async transferOwnershipToGeneralSale() {
        console.log("transferring ...");
        await this.preSaleContract.transferOwnership(generalSaleAddress, generalSaleAddress, {
            from: MASTER
        });
        console.log("transferred");

        console.log("setting shp ...");
        await this.generalSaleContract.setShp(shpAddress, {from: MASTER});

        console.log("SHP set");
    }

    //Set Initial Dynamic Ceilings 
    async setCeilings(ceilings, randomHashes) {
        let i = 0;
        console.log("setting ceileings ...");
        var hashes = [];
        for (let c of ceilings) {
            const h = await this.dynamicCeilingContract.calculateHash(
                web3.toWei(c.limit/etherPegvalue) ,
                c.slope,
                web3.toWei(c.min/etherPegvalue),
                c.last,
                web3.sha3(c.salt), { from: MASTER });
            hashes.push(h);
            console.log("hash " + i + " has been calculated" );
            i += 1; 
        }
        // add some more random hashes to conceal the total number of ceilings
        for (; i < randomHashes.length; i += 1) {
            hashes.push(randomHashes[i]);
        }
        await this.dynamicCeilingContract.setHiddenCeilings(hashes, { from: MASTER, gas: 1000000 });
    }

    //Resume GeneralSale
    async resumeGeneralSale() {
        await this.generalSaleContract.resumeContribution({
            from: MASTER
        });
    }
    //Pause GeneralSale
    async pauseGeneralSale() {
        await this.generalSaleContract.pauseContribution({
            from: MASTER
        });
    }
    //Close GeneralSale 
    async closeGeneralSale() {
        await this.generalSaleContract.closeSale({
            from: MASTER
        });
    }

    //Reveal Ceilings
    async revealCeiling(ceiling) {
        await this.dynamicCeilingContract.revealCeiling(
            web3.toWei(ceiling.limit/etherPegvalue),
            ceiling.slope,
            web3.toWei(ceiling.limit/etherPegvalue),
            ceiling.last,
            web3.sha3(ceiling.salt), { from: MASTER, gas: 1000000});
    }

    //Transfer Ownershipt to SHPController
    async transferOwnershipToSHPController() {
        await this.generalSaleContract.transferOwnership(shpControllerAddress, shpControllerAddress, {
            from: MASTER
        });
    }

    // Called after General Sale is closed
    async finalizeSale() {

        // Set reserver and founder tokens
        let preSaleFounderTokenCount = await this.preSaleContract.founderTokenCount();
        console.log("PRESALE: ", "FOUNDER", preSaleFounderTokenCount);
        let preSaleReserveTokenCount = await this.preSaleContract.reserveTokenCount();
        console.log("PRESALE: ", "RESERVE", preSaleReserveTokenCount);

        
        let generalSaleFounderTokenCount = await this.generalSaleContract.founderTokenCount();
        console.log("GENERAL SALE: ", "FOUNDER", generalSaleFounderTokenCount);
        let generalSaleReserveTokenCount = await this.generalSaleContract.reserveTokenCount();
        console.log("GENERAL SALE: ", "RESERVE", generalSaleReserveTokenCount);

        let founderTokenCount = preSaleFounderTokenCount.toNumber() + generalSaleFounderTokenCount.toNumber();
        let reserveTokenCount = preSaleReserveTokenCount.toNumber() + generalSaleReserveTokenCount.toNumber();
        
        console.log("TOTAL TOKEN COUNT - FOUNDER: ", founderTokenCount, "  -  RESERVE: ", reserveTokenCount);

        await this.shpControllerContract.setTokenCounts(reserveTokenCount, founderTokenCount, {
            from: MASTER
        });

        console.log("SET TOKEN COUNTS");

        await this.shpControllerContract.createVestingGrants({
            from: MASTER, gas : 1000000
        });

        console.log("CREATED  VESTING GRANTS");
    }
    

}
module.exports = new TokenSaleControllerScript();
