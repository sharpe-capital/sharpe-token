pragma solidity ^0.4.11;

import "./lib/Owned.sol";
import "./lib/Trustee.sol";
import "./SHP.sol";

contract SHPController is Owned {

    SHP public shp;
    Trustee public trustee;

    bool public grantsCreated = false;

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
    {
        require(reserveTokens == 0);
        require(foundersTokens == 0);
        reserveTokens = _reserveTokens;
        foundersTokens = _foundersTokens;
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