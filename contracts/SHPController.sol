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

    function setTokenCounts(uint256 _reserveTokens, uint256 _foundersTokens) public onlyOwner {
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