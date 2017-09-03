pragma solidity ^0.4.11;

import "./lib/Owned.sol";
import "./lib/SafeMath.sol";


contract AffiliateUtility is Owned {
    using SafeMath for uint256;
    
    uint256 public constant TIER2_MIN_DOLLARS = 20000;
    uint256 public constant TIER3_MIN_DOLLARS = 50000;

    uint256 public constant TIER1_PERCENT = 3;
    uint256 public constant TIER2_PERCENT = 4;
    uint256 public constant TIER3_PERCENT = 5;

    uint256 public etherToUSDExchangeRate = 300;
    uint256 public etherToSHPExchangeRate = 2000;
    
    mapping (address => bool) private affiliates;

    function AffiliateUtility() {

    }

    /// @notice sets the Ether to Dollar exhchange rate
    /// @param _newValue the new exchange rate to be applied
    function pegValue(uint256 _newValue) onlyOwner {

        etherToUSDExchangeRate = _newValue;
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
    /// @return tuple of three values (success, affiliatebonus, contributor bounse)
    function applyAffiliate(
        address _affiliate, 
        uint256 _contributorTokens, 
        uint256 _contributionValue)
        public 
        returns(bool, uint256, uint256) 
    {
        if (!isAffiliateValid(_affiliate)) {
            return (false, 0, 0);
        }
        uint256 contributorBonus = _contributorTokens.div(100);
        uint256 etherValue = _contributionValue.div(1 ether);
        
        uint256 contributionInDollars = etherValue * etherToUSDExchangeRate;
        var affiliateBonus = uint256(0);
        if (contributionInDollars < TIER2_MIN_DOLLARS ) {
            affiliateBonus = _contributorTokens.mul(TIER1_PERCENT).div(100);

        } else if (contributionInDollars >= TIER2_MIN_DOLLARS && contributionInDollars < TIER3_MIN_DOLLARS) {
            affiliateBonus = _contributorTokens.mul(TIER2_PERCENT).div(100);

        } else {
            affiliateBonus = _contributorTokens.mul(TIER3_PERCENT).div(100);
        }

        return(true, affiliateBonus, contributorBonus);
    }

    function isAffiliateValid(address _affiliate) onlyOwner returns(bool) {
        if (affiliates[_affiliate]) {
            return true;
        }
        return false;
    }

}