pragma solidity ^0.4.11;

import "./lib/SafeMath.sol";
import "./lib/Owned.sol";
import "./SHP.sol";
import "./SCD.sol";


contract Crowdsale is Owned {

    using SafeMath for uint256;

    SHP public shp;
    SCD public scd;
    address public masterAddress;
    address public contributionAddress;
    address public etherEscrowAddress;
    address public reserveAddress;
    address public founderAddress;
    uint256 public totalEtherPaid = 0;
    uint256 public totalContributions = 0;

    uint256 constant public PRE_SALE_LIMIT = 35000 ether;
    uint256 constant public ICO_LIMIT = 325000 ether;
    uint256 constant public CALLER_EXCHANGE_RATE = 2000;
    uint256 constant public RESERVE_EXCHANGE_RATE = 2000;
    uint256 constant public FOUNDER_EXCHANGE_RATE = 1000;
    uint256 constant public MAX_GAS_PRICE = 50000000000;
    uint256 constant public MAX_CALL_FREQUENCY = 100;
    uint256 constant public AFFILIATE_TIER2 = 80 ether;
    uint256 constant public AFFILIATE_TIER3 = 200 ether;

    mapping (address => uint256) public lastCallBlock;
    mapping (address => bool) private affiliates;

    bool public paused = true;
    bool public masterAddressUsed = false;

    uint256 public preSaleBegin = 4475000;
    uint256 public preSaleEnd = 4567500;
    uint256 public icoBegin = 4567500;
    uint256 public icoEnd = 4697500;
    uint256 public finalizedBlock;
    uint256 public finalizedTime;

    event NewSale(address indexed caller, uint256 etherAmount, uint256 tokensGenerated);

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
    function Crowdsale() payable {
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
        address _shp,
        address _scd
    )
      public
      onlyOwner
    {
        masterAddress = _masterAddress;
        etherEscrowAddress = _etherEscrowAddress;
        reserveAddress = _reserveAddress;
        founderAddress = _founderAddress;
        contributionAddress = _contributionAddress;
        shp = SHP(_shp);
        scd = SCD(_scd);
    }

    function isPreSaleOpen()
      internal
      returns (bool)
    {
      return getBlockNumber() >= preSaleBegin && getBlockNumber() <= preSaleEnd;
    }

    function isIcoOpen()
      internal
      returns (bool)
    {
      return getBlockNumber() >= icoBegin && getBlockNumber() <= icoEnd;
    }

    /// @notice This function fires when someone sends Ether to the address of this contract.
    /// The ETH will be exchanged for SHP and it ensures contributions cannot be made from known addresses.
    function ()
      public
      payable
      notPaused
      contributionOpen
    {

      require(
        msg.sender != etherEscrowAddress &&
        msg.sender != reserveAddress &&
        msg.sender != founderAddress &&
        msg.sender != contributionAddress);

      bool icoOpen = isIcoOpen();
      bool preSaleOpen = isPreSaleOpen();

      require(icoOpen || preSaleOpen);
      require(msg.sender != 0x0);
      require(!isContract(msg.sender));
      require(tx.gasprice <= MAX_GAS_PRICE);

      address caller = safeCaller(msg.sender);

      if(preSaleOpen) {
        require(processPreSale(caller));
      } else {
        require(processIcoSale(caller));
      }
    }

    function processPreSale(
      address caller
    )
      internal
      returns (bool)
    {
      require(totalEtherPaid <= PRE_SALE_LIMIT);
      return doBuy(caller, msg.value);
    }

    /// @notice This method will be called by the Sharpe token contribution contract to acquire SHP.
    /// @param caller SHP holder where the SHP will be minted
    /// @return True if the payment succeeds
    function processIcoSale(
      address caller
    )
      internal
      returns (bool)
    {
      require(totalEtherPaid <= (PRE_SALE_LIMIT + ICO_LIMIT));
      return doBuy(caller, msg.value);
    }

    function isAffiliateValid()
      internal
      returns (bool)
    {
        if(msg.data.length > 0) {
            address affiliateAddr = bytesToAddress(msg.data);
            if(affiliates[affiliateAddr]) {
                return true;
            }
        }
        return false;
    }

    function getAffiliate()
      internal
      returns (address)
    {
        return bytesToAddress(msg.data);
    }

    /// @notice If an affiliate is specified and valid add 1% extra SHP tokens
    /// @param tokens The initial amount of tokens to mint
    /// @return Returns the new amount of tokens (1% more if affiliate valid)
    function applyAffiliate(
      uint256 tokens
    )
      internal
      returns (uint256)
    {
      if(isAffiliateValid()) {
        return tokens.add(tokens.div(100));
      }
      return tokens;
    }

    /// @notice Calculates the affilate payment based on the number of Ether deposited
    /// @param tokens The tokens used to calculate affiliate payment
    /// @return Returns the affilate payment amount
    function getAffiliateAmount(
      uint256 tokens
    )
      internal
      returns (uint256)
    {
      if(msg.value <= AFFILIATE_TIER2) {
        return tokens.div(100);
      } else if(msg.value > AFFILIATE_TIER2 && msg.value <= AFFILIATE_TIER3) {
        return tokens.div(100).mul(2);
      }
      return tokens.div(100).mul(3);
    }

    /// @notice Pays an affiliate if they are valid and present in the transaction data
    /// @param tokens The deposit tokens used to calculate affiliate payment amount
    function payAffiliate(
      uint256 tokens
    )
      internal
    {
      if(isAffiliateValid()) {
        address affiliate = getAffiliate();
        uint256 affiliateTokens = getAffiliateAmount(tokens);
        assert(shp.generateTokens(affiliate, affiliateTokens));
        NewSale(affiliate, 0, affiliateTokens);
      }
    }

    /// @notice This method sends the Ether received to the Ether escrow address
    /// and generates the calculated number of SHP tokens, sending them to the caller's address.
    /// It also generates the founder's tokens and the reserve tokens at the same time.
    /// @return True if the payment succeeds
    function doBuy(
      address caller,
      uint256 etherAmount
    )
      internal
      returns (bool)
    {

      if (etherAmount > 0) {

        uint256 callerTokens = etherAmount.mul(CALLER_EXCHANGE_RATE);
        uint256 reserveTokens = etherAmount.mul(RESERVE_EXCHANGE_RATE);
        uint256 founderTokens = etherAmount.mul(FOUNDER_EXCHANGE_RATE);

        uint256 newCallerTokens = applyAffiliate(callerTokens);

        require(shp.generateTokens(caller, newCallerTokens));
        require(shp.generateTokens(reserveAddress, reserveTokens));
        require(shp.generateTokens(founderAddress, founderTokens));

        payAffiliate(callerTokens);

        NewSale(caller, 0, callerTokens);
        NewSale(reserveAddress, 0, reserveTokens);
        NewSale(founderAddress, 0, founderTokens);

        etherEscrowAddress.transfer(etherAmount);

        totalEtherPaid = totalEtherPaid.add(etherAmount);
        totalContributions = totalContributions.add(1);

        if(!masterAddressUsed) {
          masterAddressUsed = true;
        }

        return true;
      }
      return false;
    }

    function finalize() onlyOwner contributionOpen {
        require(getBlockNumber() >= 0);
        require(finalizedBlock == 0);
        finalizedBlock = getBlockNumber();
        finalizedTime = now;
    }

    /// @notice This adds an affiliate Ethereum address to our whitelist
    /// @param affiliateAddr The Ethereum address of the affiliate
    function whitelistAffiliate(address affiliateAddr) onlyOwner {
        affiliates[affiliateAddr] = true;
    }

    /// @notice This is an antispam mechanism
    /// @param caller the caller's address
    /// @return The safe caller address
    function safeCaller(address caller) internal returns (address) {
        if (msg.sender == address(shp)) {
            return caller;
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
    /// @param caller The address being queried
    /// @return True if `caller` is a contract
    function isContract(address caller) internal constant returns (bool) {
        if (caller == 0) {
            return false;
        } else {
            uint256 size;
            assembly {
                size := extcodesize(caller)
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

    function bytesToAddress (bytes b) internal constant returns (address) {
        uint result = 0;
        for (uint i = 0; i < b.length; i++) {
            uint c = uint(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 16 + (c - 48);
            }
            if(c >= 65 && c<= 90) {
                result = result * 16 + (c - 55);
            }
            if(c >= 97 && c<= 122) {
                result = result * 16 + (c - 87);
            }
        }
        return address(result);
    }
}
