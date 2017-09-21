pragma solidity 0.4.15;

import "./lib/SafeMath.sol";
import "./TokenSale.sol";
import "./SHP.sol";
import "./SCD.sol";


contract PreSale is TokenSale {
    using SafeMath for uint256;
 
    mapping(address => Whitelisted) public whitelist;
    
    uint256 public preSaleEtherPaid = 0;
    uint256 public gracePeriodEtherPaid = 0;
    uint256 public totalContributions = 0;
    uint256 public whitelistedPlannedContributions = 0;

    uint256 constant public FIRST_TIER_DISCOUNT = 10;
    uint256 constant public SECOND_TIER_DISCOUNT = 20;
    uint256 constant public THIRD_TIER_DISCOUNT = 30;

    bool public gracePeriod;
    bool public honourWhitelist;

    uint256 public minPresaleContributionEther;
    uint256 public maxPresaleContributionEther;

    uint256 public firstTierDiscountUpperLimitEther;
    uint256 public secondTierDiscountUpperLimitEther;
    uint256 public thirdTierDiscountUpperLimitEther;

    uint256 public preSaleCap;

    address public presaleAddress;
    
    enum ContributionState {Paused, Resumed}
    event ContributionStateChanged(address caller, ContributionState contributionState);
    enum AllowedContributionState {Whitelisted, NotWhitelisted, AboveWhitelisted, BelowWhitelisted, WhitelistClosed}
    event AllowedContributionCheck(uint256 contribution, AllowedContributionState allowedContributionState);
    event ValidContributionCheck(uint256 contribution, bool isContributionValid);
    event DiscountApplied(uint256 etherAmount, uint256 tokens, uint256 discount);
    event ContributionRefund(uint256 etherAmount, address _caller);
    event CountersUpdated(uint256 preSaleEtherPaid, uint256 gracePeriodEtherPaid, uint256 totalContributions);
    event PresaleClosed(uint256 when);
    event WhitelistedUpdated(uint256 plannedContribution, bool contributed);
    event WhitelistedCounterUpdated(uint256 whitelistedPlannedContributions, uint256 usedContributions);

    struct Whitelisted {
        uint256 plannedContribution;
        bool contributed; 
    }

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
        honourWhitelist = false;
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
        whitelist[_sender] = Whitelisted(_plannedContribution, false);
        whitelistedPlannedContributions = whitelistedPlannedContributions.add(_plannedContribution);
    }

    /// @notice Sets whether or not to honour the whitelist  
    /// @param _honourWhitelist Honour whitelist flag
    function setHonourWhitelist(bool _honourWhitelist) public onlyOwner {
        honourWhitelist = _honourWhitelist;
        if (!_honourWhitelist) {
            preSaleCap = preSaleCap.add(whitelistedPlannedContributions);
            whitelistedPlannedContributions = 0;
            WhitelistedCounterUpdated(whitelistedPlannedContributions, 0);
        }
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
        var (allowedContribution, refundAmount) = getAllowedContribution();
        
        if (!honourWhitelist) {
            AllowedContributionCheck(allowedContribution, AllowedContributionState.WhitelistClosed);
            return (allowedContribution, refundAmount);
        }
        
        if (!whitelist[msg.sender].contributed) {
            return processWhitelistedContribution(allowedContribution, refundAmount);
        } 

        AllowedContributionCheck(allowedContribution, AllowedContributionState.NotWhitelisted);
        return (allowedContribution, refundAmount);
    }

    function processWhitelistedContribution(uint256 allowedContribution, uint256 refundAmount) internal returns (uint256, uint256) {
        uint256 plannedContribution = whitelist[msg.sender].plannedContribution;
        
        whitelist[msg.sender].contributed = true;
        WhitelistedUpdated(plannedContribution, whitelist[msg.sender].contributed);
        
        if (msg.value > plannedContribution) {
            return handleAbovePlannedWhitelistedContribution(allowedContribution, plannedContribution, refundAmount);
        }
        
        if (msg.value < plannedContribution) {
            return handleBelowPlannedWhitelistedContribution(plannedContribution);
        }
        
        return handlePlannedWhitelistedContribution(plannedContribution);
    }

    function handlePlannedWhitelistedContribution(uint256 plannedContribution) internal returns (uint256, uint256) {
        updateWhitelistedContribution(plannedContribution);
        AllowedContributionCheck(plannedContribution, AllowedContributionState.Whitelisted);
        return (plannedContribution, 0);
    }
    
    function handleAbovePlannedWhitelistedContribution(uint256 allowedContribution, uint256 plannedContribution, uint256 refundAmount) internal returns (uint256, uint256) {
        updateWhitelistedContribution(plannedContribution);
        AllowedContributionCheck(allowedContribution, AllowedContributionState.AboveWhitelisted);
        return (allowedContribution, refundAmount);
    }

    function handleBelowPlannedWhitelistedContribution(uint256 plannedContribution) internal returns (uint256, uint256) {
        uint256 belowPlanned = plannedContribution.sub(msg.value);
        preSaleCap = preSaleCap.add(belowPlanned);
        
        updateWhitelistedContribution(msg.value);
        AllowedContributionCheck(msg.value, AllowedContributionState.BelowWhitelisted);
        return (msg.value, 0);
    }

    function updateWhitelistedContribution(uint256 plannedContribution) internal {
        whitelistedPlannedContributions = whitelistedPlannedContributions.sub(plannedContribution);
        WhitelistedCounterUpdated(whitelistedPlannedContributions, plannedContribution);
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