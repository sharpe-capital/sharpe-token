pragma solidity ^0.4.11;

import "./lib/SafeMath.sol";
import "./TokenSale.sol";
import "./SHP.sol";
import "./SCD.sol";


contract PreSale is TokenSale {

    using SafeMath for uint256;
 
    mapping(address => uint) whitelist;
    
    uint256 public preSaleEtherPaid = 0;
    uint256 public gracePeriodEtherPaid = 0;
    uint256 public totalContributions = 0;
    
    uint256 constant public FIRST_TIER_DISCOUNT = 10;
    uint256 constant public SECOND_TIER_DISCOUNT = 20;
    uint256 constant public THIRD_TIER_DISCOUNT = 30;

    bool public gracePeriod;
    uint256 public minPresaleContributionEther;
    uint256 public maxPresaleContributionEther;

    uint256 public firstTierDiscountUpperLimitEther;
    uint256 public secondTierDiscountUpperLimitEther;
    uint256 public thirdTierDiscountUpperLimitEther;

    uint256 public preSaleCap;

    address public presaleAddress;
    
    enum ContributionState {Paused, Resumed}

    event ContributionStateChanged(address _caller, ContributionState contributionState);
    enum AllowedContributionState {Whitelisted, NotWhitelisted, ExcessWhitelisted}
    event AllowedContributionCheck(uint256 contribution, AllowedContributionState allowedContributionState);
    event ValidContributionCheck(uint256 contribution, bool isContributionValid);
    event DiscountApplied(uint256 etherAmount, uint256 tokens, uint256 discount);
    event Contribution(uint256 etherAmount, address _caller);
    event ContributionRefund(uint256 etherAmount, address _caller);
    event CountersUpdated(uint256 preSaleEtherPaid, uint256 gracePeriodEtherPaid, uint256 totalContributions);
    event PresaleClosed(uint256 when);

    modifier isValidContribution() {
        require(validContribution());
        _;
    }

    /// @notice called only once when the contract is initialized
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _bountyAddress the address that will hold the bounty SHP
    /// @param _trusteeAddress the address that will hold the vesting SHP
    /// @param _firstTierDiscountUpperLimitEther First discount limits (WEI)
    /// @param _secondTierDiscountUpperLimitEther Second discount limits (WEI)
    /// @param _thirdTierDiscountUpperLimitEther Third discount limits (WEI)
    /// @param _minPresaleContributionEther Lower contribution range (WEI)
    /// @param _maxPresaleContributionEther Upper contribution range (WEI)
    /// @param _preSaleCap Presale cap (WEI)
    function PreSale(
        address _etherEscrowAddress,
        address _bountyAddress,
        address _trusteeAddress,
        address _affiliateUtilityAddress,
        uint256 _firstTierDiscountUpperLimitEther,
        uint256 _secondTierDiscountUpperLimitEther,
        uint256 _thirdTierDiscountUpperLimitEther,
        uint256 _minPresaleContributionEther,
        uint256 _maxPresaleContributionEther,
        uint256 _preSaleCap)
        TokenSale (
            _etherEscrowAddress,
            _bountyAddress,
            _trusteeAddress,
            _affiliateUtilityAddress
        )
    {
        gracePeriod = false;
        presaleAddress = address(this);
        setDiscountLimits(_firstTierDiscountUpperLimitEther, _secondTierDiscountUpperLimitEther, _thirdTierDiscountUpperLimitEther);
        setContributionRange(_minPresaleContributionEther, _maxPresaleContributionEther);
        preSaleCap = _preSaleCap;
    }

    /// @notice Enables the grace period, by which not whitelisted accounts can perform contributions.  
    function enableGracePeriod() public onlyOwner {
        gracePeriod = true;
    }

    /// @notice Disables the grace period, only whitelisted accounts can contribute
    function disableGracePeriod() public onlyOwner {
        gracePeriod = false;
    }

    /// @notice Set the range of accepted contributions during pre-sale  
    /// @param _minPresaleContributionEther Lower contribution range (WEI)
    /// @param _maxPresaleContributionEther Upper contribution range (WEI)
    function setContributionRange(
        uint256 _minPresaleContributionEther,
        uint256 _maxPresaleContributionEther
    ) 
        public 
        onlyOwner 
    {
        minPresaleContributionEther = _minPresaleContributionEther;
        maxPresaleContributionEther = _maxPresaleContributionEther;
    }

    /// @notice Set the presale cap  
    /// @param _preSaleCap Presale cap (WEI)
    function setPresaleCap(uint256 _preSaleCap) public onlyOwner {
        preSaleCap = _preSaleCap;
    }

    /// @notice Set the discount limits
    /// @param _firstTierDiscountUpperLimitEther First discount limits (WEI)
    /// @param _secondTierDiscountUpperLimitEther Second discount limits (WEI)
    /// @param _thirdTierDiscountUpperLimitEther Third discount limits (WEI)
    function setDiscountLimits(
        uint256 _firstTierDiscountUpperLimitEther,
        uint256 _secondTierDiscountUpperLimitEther,
        uint256 _thirdTierDiscountUpperLimitEther
    ) 
        public 
        onlyOwner 
    {
        firstTierDiscountUpperLimitEther = _firstTierDiscountUpperLimitEther;
        secondTierDiscountUpperLimitEther = _secondTierDiscountUpperLimitEther;
        thirdTierDiscountUpperLimitEther = _thirdTierDiscountUpperLimitEther;
    }
    
    /// @notice Adds to the whitelist
    /// @param _sender The address to whitelist
    /// @param _plannedContribution The planned contribution (WEI)
    function addToWhitelist(address _sender, uint256 _plannedContribution) public onlyOwner {
        whitelist[_sender] = _plannedContribution;
    }

    /// @notice This function fires when someone sends Ether to the address of this contract.
    /// The ETH will be exchanged for SHP and it ensures contributions cannot be made from known addresses.
    function ()
        public
        payable
        isValidated
        notClosed
        notPaused
    {
        address caller = msg.sender;
        Contribution(msg.value, caller);
        processPreSale(caller);
    }

    /// @notice Processes the presale if the allowed contribution is more than zero
    /// @param _caller the address sending the Ether
    function processPreSale(address _caller) internal {
        var (allowedContribution, refundAmount) = processContribution();
        if (allowedContribution > 0) {
            doBuy(_caller, allowedContribution);
            if (refundAmount > 0) {
                msg.sender.transfer(refundAmount);
            }
        } else {
            revert();
        }
    }

    function processContribution() internal isValidContribution returns (uint256, uint256) {
        uint256 plannedContribution = whitelist[msg.sender];
        var (allowedContribution, refundAmount) = getAllowedContribution();
        if (plannedContribution > 0) {
            if (msg.value > plannedContribution) {
                AllowedContributionCheck(allowedContribution, AllowedContributionState.ExcessWhitelisted);
                return (allowedContribution, refundAmount);
            }
            // TODO - if msg.value is less than plannedContribution 
            // the remainder should be allocated back to the pre-sale
            AllowedContributionCheck(allowedContribution, AllowedContributionState.Whitelisted);
            return (plannedContribution, 0);
        } else {
            AllowedContributionCheck(allowedContribution, AllowedContributionState.NotWhitelisted);
            return (allowedContribution, refundAmount);
        }
    }

    function getAllowedContribution() internal returns (uint256, uint256) {
        uint256 allowedContribution = msg.value;
        if (gracePeriod) {
            return (allowedContribution, 0);
        }
        uint256 tillCap = remainingCap();
        uint256 refundAmount = 0;
        if (msg.value > tillCap) {
            closed = true;
            allowedContribution = tillCap;
            refundAmount = msg.value.sub(allowedContribution);
            ContributionRefund(refundAmount, msg.sender);
        }
        return (allowedContribution, refundAmount);
    }

    /// @notice Returns the Ether amount remaining until the hard-cap
    /// @return the remaining cap in WEI
    function remainingCap() internal returns (uint256) {
        // TODO - this should subtract the sum of whitelist values
        return preSaleCap.sub(preSaleEtherPaid);
    }

    /// @notice Public function enables closing of the pre-sale manually if necessary
    function closeSale() public onlyOwner {
        closePreSale();
    }

    /// @notice Internal function used to close the pre-sale when the hard-cap is hit
    function closePreSale() internal {
        closed = true;
        PresaleClosed(now);
    }

    /// @notice Ensure the contribution is valid
    /// @return Returns whether the contribution is valid or not
    function validContribution() internal returns (bool) {
        bool isContributionValid = msg.value >= minPresaleContributionEther && msg.value <= maxPresaleContributionEther;
        ValidContributionCheck(msg.value, isContributionValid);
        return isContributionValid;
    }

    /// @notice Applies the discount based on the discount tiers
    /// @param _etherAmount The amount of ether used to evaluate the tier the contribution lies within
    /// @param _contributorTokens The tokens allocated based on the contribution
    function applyDiscount(
        uint256 _etherAmount, 
        uint256 _contributorTokens
    )
        internal
        returns (uint256)
    {

        uint256 discount = 0;

        if (_etherAmount <= firstTierDiscountUpperLimitEther) {
            discount = _contributorTokens.mul(FIRST_TIER_DISCOUNT).div(100);
        } else if (_etherAmount > firstTierDiscountUpperLimitEther && _etherAmount <= secondTierDiscountUpperLimitEther) {
            discount = _contributorTokens.mul(SECOND_TIER_DISCOUNT).div(100);
        } else {
            discount = _contributorTokens.mul(THIRD_TIER_DISCOUNT).div(100);
        }

        DiscountApplied(_etherAmount, _contributorTokens, discount);
        return discount.add(_contributorTokens);
    }

    /// @notice This method sends the Ether received to the Ether escrow address
    /// and generates the calculated number of SHP tokens, sending them to the caller's address.
    /// It also generates the founder's tokens and the reserve tokens at the same time.
    function doBuy(
        address _caller,
        uint256 etherAmount
    )
        internal
    {

        uint256 callerTokens = etherAmount.mul(CALLER_EXCHANGE_RATE);
        uint256 callerTokensWithDiscount = applyDiscount(etherAmount, callerTokens);

        uint256 reserveTokens = etherAmount.mul(RESERVE_EXCHANGE_RATE);
        uint256 founderTokens = etherAmount.mul(FOUNDER_EXCHANGE_RATE);
        uint256 bountyTokens = etherAmount.mul(BOUNTY_EXCHANGE_RATE);
        uint256 vestingTokens = founderTokens.add(reserveTokens);

        founderTokenCount = founderTokenCount.add(founderTokens);
        reserveTokenCount = reserveTokenCount.add(reserveTokens);

        payAffiliate(callerTokensWithDiscount, msg.value, msg.data, msg.sender);

        shp.generateTokens(_caller, callerTokensWithDiscount);
        shp.generateTokens(bountyAddress, bountyTokens);
        shp.generateTokens(trusteeAddress, vestingTokens);

        NewSale(_caller, etherAmount, callerTokensWithDiscount);
        NewSale(trusteeAddress, etherAmount, vestingTokens);
        NewSale(bountyAddress, etherAmount, bountyTokens);

        etherEscrowAddress.transfer(etherAmount);

        updateCounters(etherAmount);
    }

    /// @notice Updates the counters for the amount of Ether paid
    /// @param _etherAmount the amount of Ether paid
    function updateCounters(uint256 _etherAmount) internal {
        if (!gracePeriod) {
            preSaleEtherPaid = preSaleEtherPaid.add(_etherAmount);
        } else {
            gracePeriodEtherPaid = gracePeriodEtherPaid.add(_etherAmount);
        }
        totalContributions = totalContributions.add(1);
        CountersUpdated(preSaleEtherPaid, gracePeriodEtherPaid, _etherAmount);
    }
}