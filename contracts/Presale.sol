pragma solidity 0.4.15;

/*    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

 
import "./lib/SafeMath.sol";
import "./TokenSale.sol";
import "./SHP.sol";
import "./SCD.sol";


contract PreSale is TokenSale {
    using SafeMath for uint256;
 
    mapping(address => uint256) public whitelist;
    
    uint256 public preSaleEtherPaid = 0;
    uint256 public totalContributions = 0;
    uint256 public whitelistedPlannedContributions = 0;

    uint256 constant public FIRST_TIER_DISCOUNT = 10;
    uint256 constant public SECOND_TIER_DISCOUNT = 20;
    uint256 constant public THIRD_TIER_DISCOUNT = 30;

    uint256 public minPresaleContributionEther;
    uint256 public maxPresaleContributionEther;

    uint256 public firstTierDiscountUpperLimitEther;
    uint256 public secondTierDiscountUpperLimitEther;
    uint256 public thirdTierDiscountUpperLimitEther;

    uint256 public preSaleCap;
    uint256 public honourWhitelistEnd;

    address public presaleAddress;
    
    enum ContributionState {Paused, Resumed}
    event ContributionStateChanged(address caller, ContributionState contributionState);
    enum AllowedContributionState {Whitelisted, NotWhitelisted, AboveWhitelisted, BelowWhitelisted, WhitelistClosed}
    event AllowedContributionCheck(uint256 contribution, AllowedContributionState allowedContributionState);
    event ValidContributionCheck(uint256 contribution, bool isContributionValid);
    event DiscountApplied(uint256 etherAmount, uint256 tokens, uint256 discount);
    event ContributionRefund(uint256 etherAmount, address _caller);
    event CountersUpdated(uint256 preSaleEtherPaid, uint256 totalContributions);
    event WhitelistedUpdated(uint256 plannedContribution, bool contributed);
    event WhitelistedCounterUpdated(uint256 whitelistedPlannedContributions, uint256 usedContributions);

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
    /// @param _honourWhitelistEnd End time of whitelist period
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
        uint256 _preSaleCap,
        uint256 _honourWhitelistEnd)
        TokenSale (
            _etherEscrowAddress,
            _bountyAddress,
            _trusteeAddress,
            _affiliateUtilityAddress
        )
    {
        honourWhitelistEnd = _honourWhitelistEnd;
        presaleAddress = address(this);
        setDiscountLimits(_firstTierDiscountUpperLimitEther, _secondTierDiscountUpperLimitEther, _thirdTierDiscountUpperLimitEther);
        setContributionRange(_minPresaleContributionEther, _maxPresaleContributionEther);
        preSaleCap = _preSaleCap;
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
        whitelistedPlannedContributions = whitelistedPlannedContributions.add(_plannedContribution);
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
    function processPreSale(address _caller) private {
        var (allowedContribution, refundAmount) = processContribution();
        assert(msg.value==allowedContribution.add(refundAmount));
        if (allowedContribution > 0) {
            doBuy(_caller, allowedContribution);
            if (refundAmount > 0) {
                msg.sender.transfer(refundAmount);
                closePreSale();
            }
        } else {
            revert();
        }
    }

    /// @notice Returns true if the whitelist period is still active, false otherwise.
    /// When whitelist period ends, it will transfer any unclaimed planned contributions to the pre-sale cap. 
    function honourWhitelist() private returns (bool) {
        bool honourWhitelist = true;
        if (honourWhitelistEnd <= now) {
            honourWhitelist = false;
            preSaleCap = preSaleCap.add(whitelistedPlannedContributions);
            whitelistedPlannedContributions = 0;
            WhitelistedCounterUpdated(whitelistedPlannedContributions, 0);
        }
        return honourWhitelist;
    }

    /// @notice Returns the contribution to be used as part of the transaction, and any refund value if expected.  
    function processContribution() private isValidContribution returns (uint256, uint256) {
        var (allowedContribution, refundAmount) = getAllowedContribution();
        
        if (!honourWhitelist()) {
            AllowedContributionCheck(allowedContribution, AllowedContributionState.WhitelistClosed);
            return (allowedContribution, refundAmount);
        }
        
        if (whitelist[msg.sender] > 0) {
            return processWhitelistedContribution(allowedContribution, refundAmount);
        } 

        AllowedContributionCheck(allowedContribution, AllowedContributionState.NotWhitelisted);
        return (allowedContribution, refundAmount);
    }

    /// @notice Returns the contribution to be used for a sender that had previously been whitelisted, and any refund value if expected.
    function processWhitelistedContribution(uint256 allowedContribution, uint256 refundAmount) private returns (uint256, uint256) {
        uint256 plannedContribution = whitelist[msg.sender];
        
        whitelist[msg.sender] = 0;
        WhitelistedUpdated(plannedContribution, true);
        
        if (msg.value > plannedContribution) {
            return handleAbovePlannedWhitelistedContribution(allowedContribution, plannedContribution, refundAmount);
        }
        
        if (msg.value < plannedContribution) {
            return handleBelowPlannedWhitelistedContribution(plannedContribution);
        }
        
        return handlePlannedWhitelistedContribution(plannedContribution);
    }

    /// @notice Returns the contribution and refund value to be used when the transaction value equals the whitelisted contribution for the sender.
    /// Note that refund value will always be 0 in this case, as the planned contribution for the sender and transaction value match.
    function handlePlannedWhitelistedContribution(uint256 plannedContribution) private returns (uint256, uint256) {
        updateWhitelistedContribution(plannedContribution);
        AllowedContributionCheck(plannedContribution, AllowedContributionState.Whitelisted);
        return (plannedContribution, 0);
    }
    
    /// @notice Returns the contribution and refund value to be used when the transaction value is higher than the whitelisted contribution for the sender.
    /// Note that only in this case, the refund value will not be 0.
    function handleAbovePlannedWhitelistedContribution(uint256 allowedContribution, uint256 plannedContribution, uint256 refundAmount) private returns (uint256, uint256) {
        updateWhitelistedContribution(plannedContribution);
        AllowedContributionCheck(allowedContribution, AllowedContributionState.AboveWhitelisted);
        return (allowedContribution, refundAmount);
    }

    /// @notice Returns the contribution and refund value to be used when the transaction value is lower than the whitelisted contribution for the sender.
    /// Note that refund value will always be 0 in this case, as transaction value is below the planned contribution for this sender.
    function handleBelowPlannedWhitelistedContribution(uint256 plannedContribution) private returns (uint256, uint256) {
        uint256 belowPlanned = plannedContribution.sub(msg.value);
        preSaleCap = preSaleCap.add(belowPlanned);
        
        updateWhitelistedContribution(msg.value);
        AllowedContributionCheck(msg.value, AllowedContributionState.BelowWhitelisted);
        return (msg.value, 0);
    }

    /// @notice Updates the whitelistedPlannedContributions counter, subtracting the contribution about to be applied.
    function updateWhitelistedContribution(uint256 plannedContribution) private {
        whitelistedPlannedContributions = whitelistedPlannedContributions.sub(plannedContribution);
        WhitelistedCounterUpdated(whitelistedPlannedContributions, plannedContribution);
    }

    /// @notice Calculates the allowed contribution based on the transaction value and amount remaining till cap.
    /// If the transaction contribution is higher than cap, will return the excess amount to be refunded to sender.
    /// @return the allowed contribution and refund amount (if any). All in WEI.
    function getAllowedContribution() private returns (uint256, uint256) {
        uint256 allowedContribution = msg.value;
        uint256 tillCap = remainingCap();
        uint256 refundAmount = 0;
        if (msg.value > tillCap) {
            allowedContribution = tillCap;
            refundAmount = msg.value.sub(allowedContribution);
            ContributionRefund(refundAmount, msg.sender);
        }
        return (allowedContribution, refundAmount);
    }

    /// @notice Returns the Ether amount remaining until the hard-cap
    /// @return the remaining cap in WEI
    function remainingCap() private returns (uint256) {
        return preSaleCap.sub(preSaleEtherPaid);
    }

    /// @notice Public function enables closing of the pre-sale manually if necessary
    function closeSale() public onlyOwner {
        closePreSale();
    }

    /// @notice Private function used to close the pre-sale when the hard-cap is hit
    function closePreSale() private {
        closed = true;
        SaleClosed(now);
    }

    /// @notice Ensure the contribution is valid
    /// @return Returns whether the contribution is valid or not
    function validContribution() private returns (bool) {
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
        constant
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
        preSaleEtherPaid = preSaleEtherPaid.add(_etherAmount);
        totalContributions = totalContributions.add(1);
        CountersUpdated(preSaleEtherPaid, _etherAmount);
    }
}