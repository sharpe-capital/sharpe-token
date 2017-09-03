pragma solidity ^0.4.11;

import "./lib/Owned.sol";
import "./lib/SafeMath.sol";


contract AffiliateUtility is Owned {
    using SafeMath for uint256;
    
    uint256 public tierTwoMin;
    uint256 public tierThreeMin;

    uint256 public constant TIER1_PERCENT = 3;
    uint256 public constant TIER2_PERCENT = 4;
    uint256 public constant TIER3_PERCENT = 5;
    
    mapping (address => bool) private affiliates;

    function AffiliateUtility(uint256 _tierTwoMin, uint256 _tierThreeMin) {
        setTiers(_tierTwoMin, _tierThreeMin);
    }

    /// @notice sets the Ether to Dollar exhchange rate
    /// @param _tierTwoMin the tier 2 min (in WEI)
    /// @param _tierThreeMin the tier 3 min (in WEI)
    function setTiers(uint256 _tierTwoMin, uint256 _tierThreeMin) onlyOwner {
        tierTwoMin = _tierTwoMin;
        tierThreeMin = _tierThreeMin;
    }

    /// @notice This adds an affiliate Ethereum address to our whitelist
    /// @param _affiliate The Ethereum address of the affiliate
    function addToWhiteList(address _affiliate) onlyOwner {
        affiliates[_affiliate] = true; 
    }

    /// @notice calculates and returns the amount to token minted for affilliate
    /// @param _affiliate address of the proposed affiliate
    /// @param _contributorTokens amount of SHP tokens minted for contributor
    /// @param _contributionValue amount of ETH cotributed
    /// @return tuple of three values (success, affiliateBonus, contributorBouns)
    function applyAffiliate(
        address _affiliate, 
        uint256 _contributorTokens, 
        uint256 _contributionValue
    )
        public 
        returns(bool, uint256, uint256) 
    {
        if (!isAffiliateValid(_affiliate)) {
            return (false, 0, 0);
        }

        uint256 contributorBonus = _contributorTokens.div(100);
        uint256 affiliateBonus = 0;

        if (_contributionValue < tierTwoMin) {
            affiliateBonus = _contributorTokens.mul(TIER1_PERCENT).div(100);
        } else if (_contributionValue >= tierTwoMin && _contributionValue < tierThreeMin) {
            affiliateBonus = _contributorTokens.mul(TIER2_PERCENT).div(100);
        } else {
            affiliateBonus = _contributorTokens.mul(TIER3_PERCENT).div(100);
        }

        return(true, affiliateBonus, contributorBonus);
    }

    function isAffiliateValid(address _affiliate) returns(bool) {
        return affiliates[_affiliate];
    }
}