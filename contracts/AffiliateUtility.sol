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
    
    mapping (bytes => Affiliate) private affiliates;

    event AffiliateReceived(address affiliateAddress, bytes messageData, bool valid);

    struct Affiliate {
        address etherAddress;
        bool isPresent;
    }

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
    /// @param _key The lookup key (in bytes)
    /// @param _affiliate The Ethereum address of the affiliate
    function addAffiliate(bytes _key, address _affiliate) onlyOwner {
        affiliates[_key] = Affiliate(_affiliate, true);
    }

    /// @notice calculates and returns the amount to token minted for affilliate
    /// @param _key address of the proposed affiliate
    /// @param _contributorTokens amount of SHP tokens minted for contributor
    /// @param _contributionValue amount of ETH contributed
    /// @return tuple of two values (affiliateBonus, contributorBouns)
    function applyAffiliate(
        bytes _key, 
        uint256 _contributorTokens, 
        uint256 _contributionValue
    )
        public 
        returns(uint256, uint256) 
    {
        if (getAffiliate(_key) == address(0)) {
            return (0, 0);
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

        return(affiliateBonus, contributorBonus);
    }

    /// @notice Fetches the Ethereum address of a valid affiliate
    /// @param _key The Ethereum address in bytes format
    /// @return The Ethereum address as an address type
    function getAffiliate(bytes _key) returns(address) {
        return affiliates[_key].etherAddress;
    }

    /// @notice Checks if an affiliate is valid
    /// @param _key The Ethereum address in bytes format
    /// @param _contributor The contributing Ethereum address
    /// @return True or False
    function isAffiliateValid(bytes _key, address _contributor) public returns(bool) {
        if (_key.length == 0) {
            return false;
        }
        Affiliate memory affiliate = affiliates[_key];
        AffiliateReceived(affiliate.etherAddress, _key, affiliate.isPresent);
        require(affiliate.etherAddress != _contributor);
        return affiliate.isPresent;
    }
}