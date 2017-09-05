const Presale = artifacts.require("PresaleMock");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
// const SHP = artifacts.require("SHP");
// const SCD = artifacts.require("SCD");
// const MultiSigWallet = artifacts.require("MultiSigWallet");
// const FoundersWallet = artifacts.require("FoundersWalletMock");
// const ReserveWallet = artifacts.require("ReserveWalletMock");
// const assertFail = require("../helpers/assertFail");
// const assertBalances = require("../helpers/assertions");
// const eventsUtil = require("../helpers/eventsUtil");

// contract("Presale", function(accounts) {

//     console.log('Logging out all of the accounts for reference...');
//     accounts.forEach(acc => console.log(acc));

//     const contributorOneAddress = accounts[1];
//     const contributorTwoAddress = accounts[2];
//     const escrowSignAddress = accounts[3];
//     const reserveSignAddress = accounts[4];
//     const foundersSignAddress = accounts[5];
//     const masterAddress = accounts[6];

//     const MIN_PRESALE_CONTRIBUTION = 10000;
//     const MAX_PRESALE_CONTRIBUTION = 1000000;

//     const FIRST_TIER_DISCOUNT_UPPER_LIMIT = 49999;
//     const SECOND_TIER_DISCOUNT_UPPER_LIMIT = 249999;
//     const THIRD_TIER_DISCOUNT_UPPER_LIMIT = 1000000;
//     const PRESALE_CAP = 10000000;

//     let etherEscrowWallet;
//     let foundersWallet;
//     let reserveWallet;
//     let presale;
//     let miniMeTokenFactory;
//     let shp;
//     let scd;
//     let contributionAddress;
//     let etherEscrowAddress;
//     let foundersAddress;
//     let reserveAddress;
//     let ownerAddress;

//     let preSaleBegin;
//     let preSaleEnd;

//     let etherPeggedValue = 400;
//     let minPresaleContributionEther;
//     let maxPresaleContributionEther;
        
//     let firstTierDiscountUpperLimitEther;
//     let secondTierDiscountUpperLimitEther;
//     let thirdTierDiscountUpperLimitEther;
    
//     let preSaleCap;

//     before(async function() {

//         miniMeTokenFactory = await MiniMeTokenFactory.new();
//         presale = await Presale.new();
//         ownerAddress = accounts[0];

//         shp = await SHP.new(miniMeTokenFactory.address);
//         scd = await SCD.new(miniMeTokenFactory.address);

//         etherEscrowWallet = await MultiSigWallet.new([escrowSignAddress], 1);
//         foundersWallet = await FoundersWallet.new(shp.address, presale.address); // TODO - could apply multisign to this wallet
//         reserveWallet = await ReserveWallet.new(shp.address, presale.address); // TODO - could apply multisign to this wallet
        
//         contributionAddress = presale.address;
//         etherEscrowAddress = etherEscrowWallet.address;
//         foundersAddress = foundersWallet.address;
//         reserveAddress = reserveWallet.address;
        
//         preSaleBegin = new Date(2017, 10, 9, 14, 0, 0).getTime()/1000;
//         preSaleEnd = new Date(2017, 11, 6, 13, 59, 59).getTime()/1000;
//         preSaleValidDate = new Date(2017, 10, 10, 14, 0, 0).getTime()/1000;
//         now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

//         minPresaleContributionEther = web3.toWei(MIN_PRESALE_CONTRIBUTION/etherPeggedValue);
//         maxPresaleContributionEther = web3.toWei(MAX_PRESALE_CONTRIBUTION/etherPeggedValue);
        
//         firstTierDiscountUpperLimitEther = web3.toWei(FIRST_TIER_DISCOUNT_UPPER_LIMIT/etherPeggedValue);
//         secondTierDiscountUpperLimitEther = web3.toWei(SECOND_TIER_DISCOUNT_UPPER_LIMIT/etherPeggedValue);
//         thirdTierDiscountUpperLimitEther = web3.toWei(THIRD_TIER_DISCOUNT_UPPER_LIMIT/etherPeggedValue);

//         preSaleCap = web3.toWei(PRESALE_CAP/etherPeggedValue);

//         await shp.changeController(presale.address);

//         assertions.initialize(
//             etherEscrowAddress, 
//             contributionAddress, 
//             contributorOneAddress, 
//             contributorTwoAddress, 
//             reserveAddress, 
//             foundersAddress,
//             masterAddress,
//             shp);

//         await presale.initialize(
//             etherEscrowWallet.address, 
//             reserveWallet.address, 
//             foundersWallet.address, 
//             presale.address,
//             shp.address,
//             scd.address,
//             preSaleBegin,
//             preSaleEnd,
//             firstTierDiscountUpperLimitEther,
//             secondTierDiscountUpperLimitEther,
//             thirdTierDiscountUpperLimitEther,
//             minPresaleContributionEther,
//             maxPresaleContributionEther,
//             preSaleCap);

//         let mockTime = await presale.getTime.call();
        
//         console.log("ownerAddress: " + ownerAddress);
//         console.log("contributorOneAddress: " + contributorOneAddress);
//         console.log("contributorTwoAddress: " + contributorTwoAddress);
//         console.log("contributionAddress: " + contributionAddress);
        
//         console.log("preSaleBegin: " + preSaleBegin);
//         console.log("preSaleEnd: " + preSaleEnd);
//         console.log("preSaleValidDate: " + preSaleBegin);
//         console.log("now: " + now);

//         console.log("mockTime: " + JSON.stringify(mockTime));
//         console.log("minPresaleContributionEther: " + minPresaleContributionEther);
//         console.log("maxPresaleContributionEther: " + maxPresaleContributionEther);
//         console.log("firstTierDiscountUpperLimitEther: " + firstTierDiscountUpperLimitEther);
//         console.log("secondTierDiscountUpperLimitEther: " + secondTierDiscountUpperLimitEther);
//         console.log("thirdTierDiscountUpperLimitEther: " + thirdTierDiscountUpperLimitEther);
//         console.log("preSaleCap: " + preSaleCap);
//     });

//     it('should initialize contract with expected values', async function() {
//         assertions.expectedInitialisation(
//             presale, 
//             {
//                 etherEscrowWallet: etherEscrowWallet,
//                 reserveWallet: reserveWallet,
//                 foundersWallet: foundersWallet
//             },
//             {
//                 preSaleBegin: preSaleBegin,
//                 preSaleEnd: preSaleEnd,
//                 preSaleCap: preSaleCap,
//                 minPresaleContributionEther: minPresaleContributionEther,
//                 maxPresaleContributionEther: maxPresaleContributionEther,
//                 firstTierDiscountUpperLimitEther: firstTierDiscountUpperLimitEther,
//                 secondTierDiscountUpperLimitEther: secondTierDiscountUpperLimitEther,
//                 thirdTierDiscountUpperLimitEther: thirdTierDiscountUpperLimitEther,
//             }
//         );
//     });


//     it('should apply first tier discount', async function() {
//         await presale.sendTransaction({
//             value: minPresaleContributionEther,
//             gas: 3000000,
//             gasPrice: "20000000000", 
//             from: contributorOneAddress
//         })
//         .then(result => eventsUtil.eventLogger(result));

//         assertBalances.ether({
//             etherEscrowBalance: 25,
//             contributionBalance: 0,
//             contributorOneBalance: 75,
//             contributorTwoBalance: 100,
//             reserveBalance: 0,
//             foundersBalance: 0
//         });
//         await assertBalances.SHP({
//             etherEscrowBalance: 0,
//             contributionBalance: 0,
//             contributorOneBalance: 55000,
//             contributorTwoBalance: 0,
//             reserveBalance: 50000,
//             foundersBalance: 25000
//         });

//         let preSaleEtherPaid = (await presale.preSaleEtherPaid()).toNumber();
//         console.log("preSaleEtherPaid: " + preSaleEtherPaid);
//         assert.equal(preSaleEtherPaid, web3.toWei(25));
//     });

//     it('should accept last contribution before cap and refund exceeds to sender', async function() {
//         let newPresaleCap = web3.toWei('50', 'ether');
//         await presale.setPresaleCap(
//             newPresaleCap,
//             {
//                 from: ownerAddress
//             }
//         );

//         const newPreSaleCap = await presale.preSaleCap();
//         console.log("newPreSaleCap " + newPreSaleCap);

//         let contribution = web3.toWei('26', 'ether');
//         await presale.sendTransaction({
//             value: contribution,
//             gas: 3000000,
//             gasPrice: "20000000000", 
//             from: contributorTwoAddress
//         })
//         .then(result => eventsUtil.eventLogger(result));

//         await presale.setPresaleCap(
//             preSaleCap,
//             {
//                 from: ownerAddress
//             }
//         );
//         assert.equal(preSaleCap, (await presale.preSaleCap()).toNumber());

//         assertBalances.ether({
//             etherEscrowBalance: 50,
//             contributionBalance: 0,
//             contributorOneBalance: 75,
//             contributorTwoBalance: 75,
//             reserveBalance: 0,
//             foundersBalance: 0
//         });
//         await assertBalances.SHP({
//             etherEscrowBalance: 0,
//             contributionBalance: 0,
//             contributorOneBalance: 55000,
//             contributorTwoBalance: 55000,
//             reserveBalance: 100000,
//             foundersBalance: 50000
//         });

//         let preSaleEtherPaid = (await presale.preSaleEtherPaid()).toNumber();
//         console.log("preSaleEtherPaid: " + preSaleEtherPaid);
//         assert.equal(preSaleEtherPaid, web3.toWei(50));

//         let closed = await presale.closed();
//         console.log("closed: " + closed);
//         assert.equal(closed, true);
//     });

//     it('should not accept contributions over presale cap', async function() {
//         let newPresaleCap = web3.toWei('50', 'ether');
//         await presale.setPresaleCap(
//             newPresaleCap,
//             {
//                 from: ownerAddress
//             }
//         );

//         const newPreSaleCap = await presale.preSaleCap();
//         console.log("newPreSaleCap " + newPreSaleCap);

//         let contribution = web3.toWei('26', 'ether');
//         await presale.sendTransaction({
//             value: contribution,
//             gas: 3000000,
//             gasPrice: "20000000000", 
//             from: contributorTwoAddress
//         })
//         .then(result => eventsUtil.eventLogger(result));

//         await presale.setPresaleCap(
//             preSaleCap,
//             {
//                 from: ownerAddress
//             }
//         );
//         assert.equal(preSaleCap, (await presale.preSaleCap()).toNumber());

//         assertBalances.ether({
//             etherEscrowBalance: 50,
//             contributionBalance: 0,
//             contributorOneBalance: 75,
//             contributorTwoBalance: 75,
//             reserveBalance: 0,
//             foundersBalance: 0
//         });
//         await assertBalances.SHP({
//             etherEscrowBalance: 0,
//             contributionBalance: 0,
//             contributorOneBalance: 55000,
//             contributorTwoBalance: 55000,
//             reserveBalance: 100000,
//             foundersBalance: 50000
//         });

//         let preSaleEtherPaid = (await presale.preSaleEtherPaid()).toNumber();
//         console.log("preSaleEtherPaid: " + preSaleEtherPaid);
//         assert.equal(preSaleEtherPaid, web3.toWei(50));

//         let closed = await presale.closed();
//         console.log("closed: " + closed);
//         assert.equal(closed, true);
//     });

    

//     // it('should accept contributions of any size during grace period', async function() {
//     //     // TODO: implement
//     // });
// });