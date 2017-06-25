pragma solidity ^0.4.11;

import "./lib/SafeMath.sol";
import "./lib/Owned.sol";
import "./SHP.sol";


contract SharpeContribution is Owned {

    using SafeMath for uint256;

    SHP public shp;
    address public masterAddress;
    address public contributionAddress;
    address public etherEscrowAddress;
    address public reserveAddress;
    address public founderAddress;
    uint256 public totalEtherPaid = 0;
    uint256 public totalContributions = 0;

    uint256 constant public FAIL_SAFE_LIMIT = 300000 ether;
    uint256 constant public CALLER_EXCHANGE_RATE = 2000;
    uint256 constant public RESERVE_EXCHANGE_RATE = 2000;
    uint256 constant public FOUNDER_EXCHANGE_RATE = 1000;
    uint256 constant public MAX_GAS_PRICE = 50000000000;
    uint256 constant public MAX_CALL_FREQUENCY = 100;

    mapping (address => uint256) public lastCallBlock;

    bool public paused = true;
    bool public masterAddressUsed = false;
    
    uint256 public finalizedBlock;
    uint256 public finalizedTime;

    event NewSale(address indexed callerAddress, uint256 etherAmount, uint256 tokensGenerated);

    modifier contributionOpen() {
        // require(finalizedBlock == 0 && address(shp) != 0x0);
        require((!masterAddressUsed && masterAddress == msg.sender) || 
            (masterAddressUsed && masterAddress != msg.sender));
        _;
    }

    modifier notPaused() {
        require(!paused);
        _;
    }

    /// @notice called only once when the contract is initialized
    function SharpeContribution() payable {
        paused = false;
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
        address _contributionAddress,
        address _masterAddress,
        address _shp) public onlyOwner
    {
        masterAddress = _masterAddress;
        etherEscrowAddress = _etherEscrowAddress;
        reserveAddress = _reserveAddress;
        founderAddress = _founderAddress;
        contributionAddress = _contributionAddress;
        shp = SHP(_shp);
    }

    /// @notice This function fires when someone sends Ether to the address of this contract. 
    /// The ETH will be exchanged for SHP and it ensures contributions cannot be made from known addresses.
    function () public payable notPaused contributionOpen {
        require(msg.sender != etherEscrowAddress && 
            msg.sender != reserveAddress && 
            msg.sender != founderAddress && 
            msg.sender != contributionAddress);
        require(proxyPayment(msg.sender));
    }

    /// @notice This method will be called by the Sharpe token contribution contract to acquire SHP.
    /// @param callerAddress SHP holder where the SHP will be minted
    /// @return True if the payment succeeds
    function proxyPayment(address callerAddress) internal returns (bool) {
        require(callerAddress != 0x0);
        require(tx.gasprice <= MAX_GAS_PRICE);
        address caller = safeCaller(callerAddress);
        require(!isContract(caller));
        return doBuy(callerAddress, msg.value);
    }

    /// @notice This method sends the Ether received to the Ether escrow address
    /// and generates the calculated number of SHP tokens, sending them to the caller's address.
    /// It also generates the founder's tokens and the reserve tokens at the same time.
    /// @return True if the payment succeeds
    function doBuy(address callerAddress, uint256 etherAmount) internal returns (bool) {

        assert(totalEtherPaid <= FAIL_SAFE_LIMIT);

        if (etherAmount > 0) {

            uint256 callerTokens = etherAmount.mul(CALLER_EXCHANGE_RATE);
            uint256 reserveTokens = etherAmount.mul(RESERVE_EXCHANGE_RATE);
            uint256 founderTokens = etherAmount.mul(FOUNDER_EXCHANGE_RATE);

            assert(shp.mintTokens(callerTokens, callerAddress));
            assert(shp.mintTokens(reserveTokens, reserveAddress));
            assert(shp.mintTokens(founderTokens, founderAddress));

            NewSale(callerAddress, etherAmount, callerTokens);
            NewSale(reserveAddress, etherAmount, reserveTokens);
            NewSale(founderAddress, etherAmount, founderTokens);

            etherEscrowAddress.transfer(etherAmount);

            totalEtherPaid = totalEtherPaid.add(etherAmount);
            totalContributions = totalContributions.add(1);

            if(!masterAddressUsed) {
                masterAddressUsed = true;
            }

            return true;
        } else {
            return false;
        }
    }

    /// @notice This is an antispam mechanism
    /// @param callerAddress the caller's address
    /// @return The safe caller address
    function safeCaller(address callerAddress) internal returns (address) {
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
    function isContract(address callerAddress) internal constant returns (bool) {
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

    /// @notice Pauses the contribution if there is any issue
    function pauseContribution() onlyOwner {
        paused = true;
    }

    /// @notice Resumes the contribution
    function resumeContribution() onlyOwner {
        paused = false;
    }
}