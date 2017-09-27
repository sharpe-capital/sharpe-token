pragma solidity 0.4.15;

import "./TokenSale.sol";
import "./DynamicCeiling.sol";


contract GeneralSale is TokenSale {

    uint256 public totalEtherPaid = 0;
    uint256 public minContributionInWei;
    address public saleAddress;
    
    DynamicCeiling public dynamicCeiling;

    modifier amountValidated() {
        require(msg.value >= minContributionInWei);
        _;
    }

    /// @notice Constructs the contract with the following arguments
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _bountyAddress the address that will hold the bounty SHP
    /// @param _trusteeAddress the address that will hold the vesting SHP
    /// @param _affiliateUtilityAddress address of the deployed AffiliateUtility contract.
    /// @param _minContributionInWei minimum amount to contribution possilble
    function GeneralSale( 
        address _etherEscrowAddress,
        address _bountyAddress,
        address _trusteeAddress,
        address _affiliateUtilityAddress,
        uint256 _minContributionInWei) 
        TokenSale (
        _etherEscrowAddress,
        _bountyAddress,
        _trusteeAddress,
        _affiliateUtilityAddress) 
    {
        minContributionInWei = _minContributionInWei;
        saleAddress = address(this);
    }

    function setDynamicCeilingAddress(address _dynamicCeilingAddress) public onlyOwner {
        dynamicCeiling = DynamicCeiling(_dynamicCeilingAddress);
    }

    function () 
    public 
    payable
    notPaused
    notClosed
    isValidated 
    amountValidated
    {
        uint256 contribution = msg.value;
        uint256 remaining = dynamicCeiling.availableAmountToCollect(totalEtherPaid);
        uint256 refund = 0;

        if (remaining == 0) {
            revert();
        }

        if (contribution > remaining) {
            contribution = remaining;
            refund = msg.value.sub(contribution);
        }
        doBuy(msg.sender, contribution);
        if (refund > 0) {
            msg.sender.transfer(refund);
        }
    }

    /// @notice Applies the discount based on the discount tiers
    /// @param _etherAmount The amount of ether used to evaluate the tier the contribution lies within
    /// @param _contributorTokens The tokens allocated based on the contribution
    function applyDiscount(uint256 _etherAmount, uint256 _contributorTokens) internal constant returns (uint256) {
        return _contributorTokens;
    }

    /// @notice Updates the counters for the amount of Ether paid
    /// @param _etherAmount the amount of Ether paid
    function updateCounters(uint256 _etherAmount) internal {
        totalEtherPaid = totalEtherPaid.add(_etherAmount);
    }

    /// @notice Public function enables closing of the crowdsale manually if necessary
    function closeSale() public onlyOwner {
        closed = true;
        SaleClosed(now);
    }
}