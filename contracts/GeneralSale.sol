pragma solidity ^0.4.11;

import "./TokenSale.sol";


contract GeneralSale is TokenSale {

    uint256 public totalEtherPaid = 0;
    uint256 public minContributionInWei;
    uint256 public maxContributionInWei;
    uint256 public hardCapInWei;
    address public saleAddress;

    modifier amountValidated() {
        require(msg.value >= minContributionInWei);
        require(msg.value <= maxContributionInWei);
        _;
    }

    modifier capNotBreached() {
        require(totalEtherPaid < hardCapInWei);
        _;
    }

    /// @notice Constructs the contract with the following arguments
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _bountyAddress the address that will hold the bounty SHP
    /// @param _trusteeAddress the address that will hold the vesting SHP
    /// @param _affiliateUtilityAddress address of the deployed AffiliateUtility contract.
    /// @param _maxContributionInWei maximum amount to contribution possilble
    /// @param _minContributionInWei minimum amount to contribution possilble
    /// @param _hardCapInWei the hard cap for the sale
    function GeneralSale( 
        address _etherEscrowAddress,
        address _bountyAddress,
        address _trusteeAddress,
        address _affiliateUtilityAddress,
        uint256 _minContributionInWei,
        uint256 _maxContributionInWei,
        uint256 _hardCapInWei) 
        TokenSale (
        _etherEscrowAddress,
        _bountyAddress,
        _trusteeAddress,
        _affiliateUtilityAddress) 
    {
        hardCapInWei = _hardCapInWei;
        maxContributionInWei = _maxContributionInWei;
        minContributionInWei = _minContributionInWei;
        saleAddress = address(this);
    }

    function () 
    public 
    payable
    notPaused
    notClosed
    isValidated 
    amountValidated
    capNotBreached
    {
        uint256 contribution = msg.value;
        uint256 remaining = hardCapInWei.sub(totalEtherPaid);
        uint256 refund = 0;
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
    function applyDiscount(uint256 _etherAmount, uint256 _contributorTokens) internal returns (uint256) {
        return _contributorTokens;
    }

    /// @notice Updates the counters for the amount of Ether paid
    /// @param _etherAmount the amount of Ether paid
    function updateCounters(uint256 _etherAmount) internal {
        totalEtherPaid = totalEtherPaid.add(_etherAmount);
    }

    /// @notice Public function enables closing of the crowdsale manually if necessary
    function closeSale() public onlyOwner notClosed {
        closed = true;
    }
}