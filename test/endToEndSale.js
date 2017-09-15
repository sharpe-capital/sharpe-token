const assertFail = require("./helpers/assertFail");
const assertions = require("./helpers/assertions");
const eventsUtil = require("./helpers/eventsUtil");
const testConfig = require("./helpers/testConfig");

contract("Presale cap/limits", function(accounts) {

    before(async function() {
        await testConfig.setup(accounts);
    });

    it('should initialize contract with expected values', async function() {
        await assertions.expectedInitialisation(
            testConfig.preSale, 
            {
                etherEscrowWallet: testConfig.etherEscrowWallet,
                reserveWallet: testConfig.reserveWallet,
                foundersWallet: testConfig.foundersWallet
            },
            {
                preSaleBegin: testConfig.preSaleBegin,
                preSaleEnd: testConfig.preSaleEnd,
                preSaleCap: testConfig.preSaleCap,
                minPresaleContributionEther: testConfig.minPresaleContributionEther,
                maxPresaleContributionEther: testConfig.maxPresaleContributionEther,
                firstTierDiscountUpperLimitEther: testConfig.firstTierDiscountUpperLimitEther,
                secondTierDiscountUpperLimitEther: testConfig.secondTierDiscountUpperLimitEther,
                thirdTierDiscountUpperLimitEther: testConfig.thirdTierDiscountUpperLimitEther
            }
        );
    });

    it('should not be able to contribute before the pre-sale is open', async function() { });
    it('should open the pre-sale, set the cap and enable grace period', async function() { });
    it('should make some grace period contributions', async function() { });
    it('should make some pre-sale contributions', async function() { });
    it('should have automatically closed the pre-sale', async function() { });
    it('should ', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
    it('should...', async function() { });
});