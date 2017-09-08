pragma solidity ^0.4.11;

import "./lib/SafeMath.sol";
import "./lib/Owned.sol";
import "./SHP.sol";
import "./SCD.sol";
import "./AffiliateUtility.sol";


contract TokenSale is Owned {
    using SafeMath for uint256;
    
    SHP public shp;
    AffiliateUtility public affiliateUtility;

    address public etherEscrowAddress;
    address public reserveAddress;
    address public founderAddress;

    uint256 constant public CALLER_EXCHANGE_RATE = 2000;
    uint256 constant public FOUNDER_EXCHANGE_RATE = 1000;
    uint256 constant public RESERVE_EXCHANGE_RATE = 2000;
    uint256 constant public MAX_GAS_PRICE = 50000000000;

    bool public isSaleOpen;

    event NewTokenSale(address indexed _caller, uint256 etherAmount, uint256 tokensGenerated);

    modifier openToControbution() {
        require(isSaleOpen);
        _;
    }

    modifier isValidated() {
        require(msg.sender != etherEscrowAddress);
        require(msg.sender != reserveAddress);
        require(msg.sender != founderAddress);
        require(msg.sender != 0x0);
        require(msg.value > 0);
        require(!isContract(msg.sender)); 
        require(tx.gasprice <= MAX_GAS_PRICE);
        _;
    }
    
    /// @notice Parent constructor. This needs to be extended from the child contracts
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _reserveAddress the address that will hold the reserve SHP
    /// @param _founderAddress the address that will hold the founder's SHP
    /// @param _affiliateUtilityAddress address of the deployed AffiliateUtility contract.
    /// @param _shpAddress address of the deployed SHP contract 
    function TokenSale (
        address _etherEscrowAddress,
        address _reserveAddress,
        address _founderAddress,
        address _affiliateUtilityAddress,
        address _shpAddress
    ) {
        etherEscrowAddress = _etherEscrowAddress;
        reserveAddress = _reserveAddress;
        founderAddress = _founderAddress;
        affiliateUtility = AffiliateUtility(_affiliateUtilityAddress);
        shp = SHP(_shpAddress);
    }

    /// @notice Returns the current block number
    /// @return The current block number
    function getBlockNumber() internal constant returns (uint256) {
        return block.number;
    }

    /// @notice Internal function to determine if an address is a contract
    /// @param _caller The address being queried
    /// @return True if `caller` is a contract
    function isContract(address _caller) internal constant returns (bool) {
        if (_caller == 0) {
            return false;
        } else {
            uint256 size;
            assembly {
                size := extcodesize(_caller)
            }
            return (size > 0);
        }
    }

    /// @notice Pauses the contribution if there is any issue
    function pauseContribution() public payable onlyOwner {
        isSaleOpen = false;
    }

    /// @notice Resumes the contribution
    function resumeContribution() public payable onlyOwner {
        isSaleOpen = true;
    }

    function bytesToAddress (bytes b) internal returns (address) {
        uint result = 0;
        for (uint i = 0; i < b.length; i++) {
            uint c = uint(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 16 + (c - 48);
            } 
            if (c >= 65 && c <= 90) {
                result = result * 16 + (c - 55);
            }
            if (c >= 97 && c <= 122) {
                result = result * 16 + (c - 87);
            }
        }
        return address(result);
    }

    //////////
    // MiniMe Controller Interface functions
    //////////

    // In between the offering and the network. Default settings for allowing token transfers.
    function proxyPayment(address) public payable returns (bool) {
        return false;
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return false;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return false;
    }

    /// @notice this will be used to transfer the TokenController contract
    /// @param _newController address of the new contract that will act as TokenController
    function changeController(address _newController) onlyOwner public {
        shp.changeController(_newController);
    }

    //////////
    // Testing specific methods
    //////////

    /// @notice This function is overrided by the test Mocks.
    function getTime() public returns (uint256) {
        return now;
    }

}