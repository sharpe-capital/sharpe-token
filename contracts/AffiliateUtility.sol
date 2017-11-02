pragma solidity 0.4.18;

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

import "./lib/Owned.sol";
import "./lib/SafeMath.sol";


contract AffiliateUtility is Owned {
    using SafeMath for uint256;
    
    uint256 public tierTwoMin;
    uint256 public tierThreeMin;

    uint256 public constant TIER1_PERCENT = 3;
    uint256 public constant TIER2_PERCENT = 4;
    uint256 public constant TIER3_PERCENT = 5;
    
    mapping (address => Affiliate) private affiliates;

    event AffiliateReceived(address affiliateAddress, address investorAddress, bool valid);

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
    /// @param _investor The investor's address
    /// @param _affiliate The Ethereum address of the affiliate
    function addAffiliate(address _investor, address _affiliate) onlyOwner {
        affiliates[_investor] = Affiliate(_affiliate, true);
    }

    /// @notice calculates and returns the amount to token minted for affilliate
    /// @param _investor address of the investor
    /// @param _contributorTokens amount of SHP tokens minted for contributor
    /// @param _contributionValue amount of ETH contributed
    /// @return tuple of two values (affiliateBonus, contributorBouns)
    function applyAffiliate(
        address _investor, 
        uint256 _contributorTokens, 
        uint256 _contributionValue
    )
        public 
        returns(uint256, uint256) 
    {
        if (getAffiliate(_investor) == address(0)) {
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
    /// @param _investor The Ethereum address of the investor
    /// @return The Ethereum address as an address type
    function getAffiliate(address _investor) constant returns(address) {
        return affiliates[_investor].etherAddress;
    }

    /// @notice Checks if an affiliate is valid
    /// @param _investor The Ethereum address of the investor
    /// @return True or False
    function isAffiliateValid(address _investor) constant public returns(bool) {
        Affiliate memory affiliate = affiliates[_investor];
        AffiliateReceived(affiliate.etherAddress, _investor, affiliate.isPresent);
        return affiliate.isPresent;
    }
}