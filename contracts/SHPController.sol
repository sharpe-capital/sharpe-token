pragma solidity 0.4.17;

import "./lib/Owned.sol";
import "./lib/Trustee.sol";
import "./SHP.sol";

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

 
contract SHPController is Owned, TokenController {

    SHP public shp;
    Trustee public trustee;

    bool public grantsCreated = false;
    bool public tokenCountSet = false;

    address public reserveAddress;
    address public foundersAddress;
    uint256 public reserveTokens = 0;
    uint256 public foundersTokens = 0;
    uint256 public WEEKS_26 = 26 weeks;
    uint256 public WEEKS_104 = 104 weeks;

    modifier grantsNotCreated() {
        require(!grantsCreated);
        _;
    }

    modifier tokenCountNotSet() {
        require(!tokenCountSet);
        _;
    }

    function SHPController(
        address _reserveAddress, 
        address _foundersAddress
    ) {
        reserveAddress = _reserveAddress;
        foundersAddress = _foundersAddress;
    }

    function () public payable {
        revert();
    }

    function setTokenCounts(
        uint256 _reserveTokens,
        uint256 _foundersTokens
    ) 
        public 
        onlyOwner
        tokenCountNotSet
    {
        reserveTokens = _reserveTokens;
        foundersTokens = _foundersTokens;
        tokenCountSet = true;
    }

    function setContracts(address _shpAddress, address _trusteeAddress) public onlyOwner {
        shp = SHP(_shpAddress);
        trustee = Trustee(_trusteeAddress);
    }

    function createVestingGrants() public onlyOwner grantsNotCreated {
        uint256 cliff = now + WEEKS_26;
        uint256 end = now + WEEKS_104;
        trustee.grant(reserveAddress, reserveTokens, now, cliff, end, false);
        trustee.grant(foundersAddress, foundersTokens, now, cliff, end, false);
        grantsCreated = true;
    }

    //////////
    // MiniMe Controller Interface functions
    //////////

    // In between the offering and the network. Default settings for allowing token transfers.
    function proxyPayment(address) public payable returns (bool) {
        return false;
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return true;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return true;
    }
}