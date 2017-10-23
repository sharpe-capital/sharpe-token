let Web3 = require('web3');
var provider = new Web3.providers.HttpProvider("http://52.210.215.150:8545")
let contract = require('truffle-contract')
const web3 = new Web3();
// const sha3 = require('solidity-sha3');

const MiniMeTokenFactory = contract(require('../build/contracts/MiniMeTokenFactory'));
const MiniMeToken = contract(require('../build/contracts/MiniMeToken.json'));
const GeneralSale = contract(require('../build/contracts/GeneralSale.json'));
const SHP = contract(require('../build/contracts/SHP.json'));
const SCD = contract(require('../build/contracts/SCD.json'));
const AffiliateUtility = contract(require('../build/contracts/AffiliateUtility.json'));
const DynamicCeiling = contract(require('../build/contracts/DynamicCeiling.json'));
const Presale = contract(require('../build/contracts/Presale.json'));
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


const MASTER = "0x57a2925eee743a6f29997e65ea2948f296e84b08";

var preSaleAddress = "0x2af6ce8e288efbee68c601b7cda01113c84a5f18";
var generalSaleAddress = "0xf5f19bf6f21f2312a81277b71f103a874c306a76";
var affiliateUtilityAddress = "0x6d6b07a4d9032cf854e4b9b582f71b2f104bb4af";
var shpAddress = "0x52e76ec72458781004a2505da909418947adde9c";
var shpControllerAddress = "0xd7720a32c4863d3cfedeefc7bf4b9c408009f3d8";
var trusteeAddress = "0xd911346ce1143f9ebc7d17bd973c366b99ffe3db";
var dynamicCeilingAddress = "0x5e1618864a1f4c7a1cf43d4d1f69f02f0b28068d";

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
        // console.log();
        // console.log(JSON.stringify(web3));
        for (let c of ceilings) {
            const h = await this.dynamicCeilingContract.calculateHash(
                c[0],
                c[1],
                c[2],
                i === ceilings.length - 1,
                web3.sha3(c[3]), { from: MASTER });
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
    async revealCeiling(ceiling, isLast) {
        await this.dynamicCeilingContract.revealCeiling(
            ceiling[0],
            ceiling[1],
            ceiling[2],
            isLast,
            web3.sha3(ceiling[3]), { from: MASTER, gas: 1000000});
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
