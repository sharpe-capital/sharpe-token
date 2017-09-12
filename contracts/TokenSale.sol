pragma solidity ^0.4.11;

import "./lib/SafeMath.sol";
import "./lib/Owned.sol";
import "./lib/Trustee.sol";
import "./SHP.sol";
import "./SCD.sol";
import "./AffiliateUtility.sol";


contract TokenSale is Owned, TokenController {
    using SafeMath for uint256;
    
    SHP public shp;
    AffiliateUtility public affiliateUtility;
    Trustee public trustee;

    address public etherEscrowAddress;
    address public bountyAddress;
    address public trusteeAddress;

    uint256 public founderTokenCount = 0;
    uint256 public reserveTokenCount = 0;

    uint256 constant public CALLER_EXCHANGE_RATE = 2000;
    uint256 constant public RESERVE_EXCHANGE_RATE = 1500;
    uint256 constant public FOUNDER_EXCHANGE_RATE = 1000;
    uint256 constant public BOUNTY_EXCHANGE_RATE = 500;
    uint256 constant public MAX_GAS_PRICE = 50000000000;

    bool public paused;
    bool public closed;

    event NewSale(address indexed caller, uint256 etherAmount, uint256 tokensGenerated);

    modifier notPaused() {
        require(!paused);
        _;
    }

    modifier notClosed() {
        require(!closed);
        _;
    }

    modifier isValidated() {
        require(msg.sender != 0x0);
        require(msg.value > 0);
        require(!isContract(msg.sender)); 
        require(tx.gasprice <= MAX_GAS_PRICE);
        _;
    }
    
    /// @notice Parent constructor. This needs to be extended from the child contracts
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _bountyAddress the address that will hold the bounty scheme SHP
    /// @param _trusteeAddress the address that will hold the vesting SHP
    /// @param _affiliateUtilityAddress address of the deployed AffiliateUtility contract.
    function TokenSale (
        address _etherEscrowAddress,
        address _bountyAddress,
        address _trusteeAddress,
        address _affiliateUtilityAddress
    ) {
        etherEscrowAddress = _etherEscrowAddress;
        bountyAddress = _bountyAddress;
        trusteeAddress = _trusteeAddress;
        affiliateUtility = AffiliateUtility(_affiliateUtilityAddress);
        trustee = Trustee(_trusteeAddress);
        paused = false;
        closed = false;
    }

    /// @notice Pays an affiliate if they are valid and present in the transaction data
    /// @param _tokens The contribution tokens used to calculate affiliate payment amount
    /// @param _etherValue The Ether value sent
    /// @param _data The txn payload data
    /// @param _caller The address of the caller
    function payAffiliate(uint256 _tokens, uint256 _etherValue, bytes _data, address _caller) internal {
        if (affiliateUtility.isAffiliateValid(_data, _caller)) {
            address affiliate = affiliateUtility.getAffiliate(_data);
            var (affiliateBonus, contributorBonus) = affiliateUtility.applyAffiliate(_data, _tokens, _etherValue);
            shp.generateTokens(affiliate, affiliateBonus);
            shp.generateTokens(_caller, contributorBonus);
        }
    }

    /// @notice Sets the SHP token smart contract
    /// @param _shp the SHP token contract address
    function setShp(address _shp) public onlyOwner {
        shp = SHP(_shp);
    }

    /// @notice Transfers ownership of the token smart contract and trustee
    /// @param _tokenController the address of the new token controller
    /// @param _trusteeOwner the address of the new trustee owner
    function transferOwnership(address _tokenController, address _trusteeOwner) public onlyOwner {
        require(closed);
        shp.changeController(_tokenController);
        trustee.changeOwner(_trusteeOwner);
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
        paused = true;
    }

    /// @notice Resumes the contribution
    function resumeContribution() public payable onlyOwner {
        paused = false;
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

    //////////
    // Testing specific methods
    //////////

    /// @notice This function is overrided by the test Mocks.
    function getTime() public returns (uint256) {
        return now;
    }
}