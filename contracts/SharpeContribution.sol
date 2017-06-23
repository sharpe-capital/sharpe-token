pragma solidity ^0.4.11;

import "./SHP.sol";
import "./MiniMeToken.sol";
import "./SafeMath.sol";
import "./Owned.sol";


contract SharpeContribution is Owned, TokenController {

    using SafeMath for uint256;

    MiniMeToken public shp;
    address public contributionAddress;
    address public etherEscrowAddress;
    address public reserveAddress;
    address public founderAddress;
    uint256 public totalEtherPaid = 0;

    uint256 constant public FAIL_SAFE_LIMIT = 300000 ether;
    uint256 constant public CALLER_EXCHANGE_RATE = 2000;
    uint256 constant public RESERVE_EXCHANGE_RATE = 2000;
    uint256 constant public FOUNDER_EXCHANGE_RATE = 1000;
    uint256 constant public MAX_GAS_PRICE = 50000000000;
    uint256 constant public MAX_CALL_FREQUENCY = 100;

    mapping (address => uint256) public lastCallBlock;

    bool public paused = true;
    
    uint256 public finalizedBlock;
    uint256 public finalizedTime;

    modifier initialized() {
        require(address(shp) != 0x0);
        _;
    }

    modifier contributionOpen() {
        require(finalizedBlock == 0 && address(shp) != 0x0);
        _;
    }

    modifier notPaused() {
        require(!paused);
        _;
    }

    /// @notice Initializes the contribution contract with all of the other addresses
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _reserveAddress the address that will hold the reserve SHP
    /// @param _founderAddress the address that will hold the founder's SHP
    /// @param _contributionAddress the SHP contribution address
    function initialize(
        address _etherEscrowAddress, 
        address _reserveAddress, 
        address _founderAddress, 
        address _contributionAddress) public 
    {
        etherEscrowAddress = _etherEscrowAddress;
        reserveAddress = _reserveAddress;
        founderAddress = _founderAddress;
        contributionAddress = _contributionAddress;
        shp = SHP(_contributionAddress);
    }

    /// @notice called only once when the contract is initialized
    function SharpeContribution() public {
        paused = false;
    }

    /// @notice If anybody sends Ether directly to this contract, assume they are buying Sharpe tokens
    function () public payable notPaused {
        proxyPayment(msg.sender);
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return false;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return false;
    }

    /// @notice This method will generally be called by the Sharpe token contribution contract to
    /// acquire SHP. Or directly from third parties that want to acquire SHP on behalf of a token holder.
    /// @param callerAddress SHP holder where the SHP will be minted.
    /// @return True if the payment succeeds
    function proxyPayment(address callerAddress) public payable notPaused initialized contributionOpen returns (bool) {
        require(callerAddress != 0x0);
        require(tx.gasprice <= MAX_GAS_PRICE);
        address caller = safeCaller(callerAddress);
        require(!isContract(caller));
        require(getBlockNumber().sub(lastCallBlock[caller]) >= MAX_CALL_FREQUENCY);
        lastCallBlock[caller] = getBlockNumber();
        return doBuy(callerAddress, msg.value);
    }

    /// @notice This is an antispam mechanism
    /// @param callerAddress the caller's address
    /// @return The safe caller address
    function safeCaller(address callerAddress) returns (address) {
        if (msg.sender == address(shp)) {
            return callerAddress;
        } else {
            return msg.sender;
        }
    }

    /// @notice Returns the current block number
    /// @return The current block number
    function getBlockNumber() internal constant returns (uint256) {
        return block.number;
    }

    /// @notice Internal function to determine if an address is a contract
    /// @param callerAddress The address being queried
    /// @return True if `callerAddress` is a contract
    function isContract(address callerAddress) constant internal returns (bool) {
        if (callerAddress == 0) {
            return false;
        } else {
            uint256 size;
            assembly {
                size := extcodesize(callerAddress)
            }
            return (size > 0);
        }
    }

    /// @notice This method sends the Ether received to the Ether escrow address
    /// and generates the calculated number of SHP tokens, sending them to the caller's address.
    /// It also generates the founder's tokens and the reserve tokens at the same time.
    /// @return True if the payment succeeds
    function doBuy(address callerAddress, uint256 etherAmount) internal returns (bool) {
        assert(totalEtherPaid <= FAIL_SAFE_LIMIT);
        totalEtherPaid = totalEtherPaid.add(etherAmount);
        if (etherAmount > 0) {
            uint256 callerTokens = etherAmount.mul(CALLER_EXCHANGE_RATE);
            uint256 reserveTokens = etherAmount.mul(RESERVE_EXCHANGE_RATE);
            uint256 founderTokens = etherAmount.mul(FOUNDER_EXCHANGE_RATE);
            assert(shp.generateTokens(callerAddress, callerTokens));
            assert(shp.generateTokens(reserveAddress, reserveTokens));
            assert(shp.generateTokens(founderAddress, founderTokens));
            etherEscrowAddress.transfer(etherAmount);
            NewSale(callerAddress, etherAmount, callerTokens);
            NewSale(reserveAddress, etherAmount, reserveTokens);
            NewSale(founderAddress, etherAmount, founderTokens);
            return true;
        } else {
            return false;
        }
    }

    event NewSale(address indexed callerAddress, uint256 etherAmount, uint256 tokensGenerated);
}