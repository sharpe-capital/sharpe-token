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


contract SharpeCrowdsale is TokenSale {
    using SafeMath for uint256;
 
    uint256 public etherPaid = 0;
    uint256 public totalContributions = 0;

    uint256 constant public FIRST_TIER_DISCOUNT = 5;
    uint256 constant public SECOND_TIER_DISCOUNT = 10;
    uint256 constant public THIRD_TIER_DISCOUNT = 20;
    uint256 constant public FOURTH_TIER_DISCOUNT = 30;

    uint256 public minPresaleContributionEther;
    uint256 public maxPresaleContributionEther;
    uint256 public minDiscountEther; // 1,500
    uint256 public firstTierDiscountUpperLimitEther; // 10,000
    uint256 public secondTierDiscountUpperLimitEther; // 50,000
    uint256 public thirdTierDiscountUpperLimitEther; // 250,000
    
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
    /// @param _minDiscountEther Lower discount limit (WEI)
    /// @param _firstTierDiscountUpperLimitEther First discount limits (WEI)
    /// @param _secondTierDiscountUpperLimitEther Second discount limits (WEI)
    /// @param _thirdTierDiscountUpperLimitEther Third discount limits (WEI)
    /// @param _minPresaleContributionEther Lower contribution range (WEI)
    /// @param _maxPresaleContributionEther Upper contribution range (WEI)
    /// @param _shpExchangeRate The initial SHP exchange rate
    function SharpeCrowdsale(
        address _etherEscrowAddress,
        address _bountyAddress,
        address _trusteeAddress,
        uint256 _minDiscountEther,
        uint256 _firstTierDiscountUpperLimitEther,
        uint256 _secondTierDiscountUpperLimitEther,
        uint256 _thirdTierDiscountUpperLimitEther,
        uint256 _minPresaleContributionEther,
        uint256 _maxPresaleContributionEther,
        uint256 _shpExchangeRate)
        TokenSale (
            _etherEscrowAddress,
            _bountyAddress,
            _trusteeAddress,
            _shpExchangeRate
        )
    {
        minDiscountEther = _minDiscountEther;
        firstTierDiscountUpperLimitEther = _firstTierDiscountUpperLimitEther;
        secondTierDiscountUpperLimitEther = _secondTierDiscountUpperLimitEther;
        thirdTierDiscountUpperLimitEther = _thirdTierDiscountUpperLimitEther;
        minPresaleContributionEther = _minPresaleContributionEther;
        maxPresaleContributionEther = _maxPresaleContributionEther;
    }

    /// @notice Allows the owner to peg Ether values
    /// @param _minDiscountEther Lower discount limit (WEI)
    /// @param _firstTierDiscountUpperLimitEther First discount limits (WEI)
    /// @param _secondTierDiscountUpperLimitEther Second discount limits (WEI)
    /// @param _thirdTierDiscountUpperLimitEther Third discount limits (WEI)
    /// @param _minPresaleContributionEther Lower contribution range (WEI)
    /// @param _maxPresaleContributionEther Upper contribution range (WEI)
    function pegEtherValues(
        uint256 _minDiscountEther,
        uint256 _firstTierDiscountUpperLimitEther,
        uint256 _secondTierDiscountUpperLimitEther,
        uint256 _thirdTierDiscountUpperLimitEther,
        uint256 _minPresaleContributionEther,
        uint256 _maxPresaleContributionEther
    ) 
        onlyOwner
    {
        minDiscountEther = _minDiscountEther;
        firstTierDiscountUpperLimitEther = _firstTierDiscountUpperLimitEther;
        secondTierDiscountUpperLimitEther = _secondTierDiscountUpperLimitEther;
        thirdTierDiscountUpperLimitEther = _thirdTierDiscountUpperLimitEther;
        minPresaleContributionEther = _minPresaleContributionEther;
        maxPresaleContributionEther = _maxPresaleContributionEther;
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
        require(msg.value > 0);
        doBuy(msg.sender, msg.value);
    }

    /// @notice Public function enables closing of the pre-sale manually if necessary
    function closeSale() public onlyOwner {
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

        if (_etherAmount > minDiscountEther && _etherAmount <= firstTierDiscountUpperLimitEther) {
            discount = _contributorTokens.mul(FIRST_TIER_DISCOUNT).div(100); // 5%
        } else if (_etherAmount > firstTierDiscountUpperLimitEther && _etherAmount <= secondTierDiscountUpperLimitEther) {
            discount = _contributorTokens.mul(SECOND_TIER_DISCOUNT).div(100); // 10%
        } else if (_etherAmount > secondTierDiscountUpperLimitEther && _etherAmount <= thirdTierDiscountUpperLimitEther) {
            discount = _contributorTokens.mul(THIRD_TIER_DISCOUNT).div(100); // 20%
        } else if (_etherAmount > thirdTierDiscountUpperLimitEther) {
            discount = _contributorTokens.mul(FOURTH_TIER_DISCOUNT).div(100); // 30%
        }

        DiscountApplied(_etherAmount, _contributorTokens, discount);
        return discount.add(_contributorTokens);
    }

    /// @notice Updates the counters for the amount of Ether paid
    /// @param _etherAmount the amount of Ether paid
    function updateCounters(uint256 _etherAmount) internal {
        etherPaid = etherPaid.add(_etherAmount);
        totalContributions = totalContributions.add(1);
        CountersUpdated(etherPaid, _etherAmount);
    }
}