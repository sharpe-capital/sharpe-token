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
    uint256 public reserveTokens;
    uint256 public foundersTokens;

    modifier grantsNotCreated() {
        require(!grantsCreated);
        _;
    }

    function SHPController(
        address _reserveAddress, 
        address _foundersAddress,
        uint256 _reserveTokens,
        uint256 _foundersTokens
    ) {
        reserveAddress = _reserveAddress;
        foundersAddress = _foundersAddress;
        reserveTokens = _reserveTokens;
        foundersTokens = _foundersTokens;
    }

    function () public payable {
        revert();
    }

    function setShp(address _shpAddress, address _trusteeAddress) public onlyOwner {
        shp = SHP(_shpAddress);
        trustee = Trustee(_trusteeAddress);
    }

    function createVestingGrants() public onlyOwner grantsNotCreated {
        trustee.grant(reserveAddress, reserveTokens, 0, 0, 0, false);
        trustee.grant(foundersAddress, foundersTokens, 0, 0, 0, false);
        grantsCreated = true;
    }

    // TODO - add a method to proxy claiming the tokens to the owner of this smart contract
    // The contract that is allowed to do this should be a Multisig

    //////////
    // MiniMe Controller Interface functions
    //////////

    // In between the offering and the network. Default settings for allowing token transfers.
    function proxyPayment(address) public payable returns (bool) {
        return true;
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return true;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return true;
    }
}