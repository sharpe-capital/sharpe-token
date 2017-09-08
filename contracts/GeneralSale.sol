pragma solidity ^0.4.11;

import "./TokenSale.sol";


contract GeneralSale is TokenSale {

    uint256 public totalEtherPaid = 0;
    uint256 public totalContributions = 0;
    
    uint256 public minContributionInWei;

    /// @notice Constructs the contract with the following arguments
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _bountyAddress the address that will hold the bounty SHP
    /// @param _trusteeAddress the address that will hold the vesting SHP
    /// @param _affiliateUtilityAddress address of the deployed AffiliateUtility contract.
    /// @param _minContributionInWei minimum amound to contribution possilble
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
    }

    function () 
    public 
    payable
    notPaused
    notClosed
    isValidated 
    {
        uint256 etherAmount = msg.value;
        require(etherAmount >= minContributionInWei);

        uint256 callerTokens = etherAmount.mul(CALLER_EXCHANGE_RATE);
        uint256 reserveTokens = etherAmount.mul(RESERVE_EXCHANGE_RATE);
        uint256 founderTokens = etherAmount.mul(FOUNDER_EXCHANGE_RATE);
        uint256 bountyTokens = etherAmount.mul(BOUNTY_EXCHANGE_RATE);
        uint256 vestingTokens = founderTokens.add(reserveTokens);
        
        payAffiliate(callerTokens,msg.value, msg.data, msg.sender);

        require(shp.generateTokens(msg.sender, callerTokens));
        shp.generateTokens(bountyAddress, bountyTokens);
        shp.generateTokens(trusteeAddress, vestingTokens);

        NewSale(msg.sender, etherAmount, callerTokens);
        NewSale(trusteeAddress, etherAmount, vestingTokens);
        NewSale(bountyAddress, etherAmount, bountyTokens);

        //TODO: investigate withdraw pattern
        etherEscrowAddress.transfer(etherAmount);
        updateCounters(etherAmount);
    }

    function updateCounters(uint256 _etherAmount) {
        totalContributions = totalContributions.add(1);
    }
}