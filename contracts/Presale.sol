pragma solidity ^0.4.11;

import "./lib/SafeMath.sol";
import "./lib/Owned.sol";
import "./SHP.sol";
import "./SCD.sol";

contract PreSale is Owned {

    using SafeMath for uint256;

    SHP public shp;
    SCD public scd;

    address public presaleAddress;
    address public etherEscrowAddress;
    address public reserveAddress;
    address public founderAddress;
 
    uint256 public preSaleEtherPaid = 0;
    uint256 public gracePeriodEtherPaid = 0;
    uint256 public totalContributions = 0;
    
    uint256 constant public CALLER_EXCHANGE_RATE = 2000;
    uint256 constant public RESERVE_EXCHANGE_RATE = 2000;
    uint256 constant public FOUNDER_EXCHANGE_RATE = 1000;
    uint256 constant public MAX_GAS_PRICE = 50000000000;
    
    uint256 constant public FIRST_TIER_DISCOUNT = 10;
    uint256 constant public SECOND_TIER_DISCOUNT = 20;
    uint256 constant public THIRD_TIER_DISCOUNT = 30;

    bool public gracePeriod;
    uint256 public minPresaleContributionEther;
    uint256 public maxPresaleContributionEther;

    uint256 public firstTierDiscountUpperLimitEther;
    uint256 public secondTierDiscountUpperLimitEther;
    uint256 public thirdTierDiscountUpperLimitEther;

    uint256 public preSaleCap;

    bool public paused;
    bool public closed;

    uint256 public finalizedBlock;
    uint256 public finalizedTime;

    Refund refund;
    event NewSale(address indexed caller, uint256 etherAmount, uint256 tokensGenerated);

    enum ContributionState {Paused, Resumed}
    event ContributionStateChanged(address caller, ContributionState contributionState);
    event ValidContributionCheck(uint256 contribution, bool isContributionValid);
    event DiscountApplied(uint256 etherAmount, uint256 tokens, uint256 discount);
    event Contribution(uint256 etherAmount, address caller);
    event ContributionRefund(uint256 etherAmount, address caller);
    event CountersUpdated(uint256 preSaleEtherPaid, uint256 gracePeriodEtherPaid, uint256 totalContributions);
    event PresaleClosed(uint256 when);

    struct Refund {
      address refundTo;
      uint256 amount;
    }

    modifier notPaused() {
        require(!paused);
        _;
    }

    modifier notClosed() {
        require(!closed);
        _;
    }

    modifier isValidContribution() {
        require(validContribution());
        _;
    }

    /// @notice called only once when the contract is initialized
    function PreSale() {
        paused = false;
        closed = false;
        gracePeriod = false;
    }

    /// @notice Initializes the contribution contract with all of the other addresses
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _reserveAddress the address that will hold the reserve SHP
    /// @param _founderAddress the address that will hold the founder's SHP
    /// @param _firstTierDiscountUpperLimitEther First discount limits (WEI)
    /// @param _secondTierDiscountUpperLimitEther Second discount limits (WEI)
    /// @param _thirdTierDiscountUpperLimitEther Third discount limits (WEI)
    /// @param _minPresaleContributionEther Lower contribution range (WEI)
    /// @param _maxPresaleContributionEther Upper contribution range (WEI)
    /// @param _preSaleCap Presale cap (WEI)
    function initialize(
        address _etherEscrowAddress,
        address _reserveAddress,
        address _founderAddress,
        address _shp,
        address _scd,
        uint256 _firstTierDiscountUpperLimitEther,
        uint256 _secondTierDiscountUpperLimitEther,
        uint256 _thirdTierDiscountUpperLimitEther,
        uint256 _minPresaleContributionEther,
        uint256 _maxPresaleContributionEther,
        uint256 _preSaleCap)
      public
      onlyOwner
    {
        etherEscrowAddress = _etherEscrowAddress;
        reserveAddress = _reserveAddress;
        founderAddress = _founderAddress;
        presaleAddress = address(this);
        shp = SHP(_shp);
        scd = SCD(_scd);
        setDiscountLimits(_firstTierDiscountUpperLimitEther, _secondTierDiscountUpperLimitEther, _thirdTierDiscountUpperLimitEther);
        setContributionRange(_minPresaleContributionEther, _maxPresaleContributionEther);
        preSaleCap = _preSaleCap;
    }

    /// @notice Enables the grace period, by which not whitelisted accounts can perform contributions.  
    /// @param _gracePeriod Whether or not we are during pre-sale grace period 
    function enableGracePeriod(bool _gracePeriod) public onlyOwner {
        gracePeriod = _gracePeriod;
    }

    /// @notice Set the range of accepted contributions during pre-sale  
    /// @param _minPresaleContributionEther Lower contribution range (WEI)
    /// @param _maxPresaleContributionEther Upper contribution range (WEI)
    function setContributionRange(
      uint256 _minPresaleContributionEther,
      uint256 _maxPresaleContributionEther) public onlyOwner {
        minPresaleContributionEther = _minPresaleContributionEther;
        maxPresaleContributionEther = _maxPresaleContributionEther;
    }

    /// @notice Set the presale cap  
    /// @param _preSaleCap Presale cap (WEI)
    function setPresaleCap(uint256 _preSaleCap) public onlyOwner {
        preSaleCap = _preSaleCap;
    }

    /// @notice Set the discount limits
    /// @param _firstTierDiscountUpperLimitEther First discount limits (WEI)
    /// @param _secondTierDiscountUpperLimitEther Second discount limits (WEI)
    /// @param _thirdTierDiscountUpperLimitEther Third discount limits (WEI)
    function setDiscountLimits(
      uint256 _firstTierDiscountUpperLimitEther,
      uint256 _secondTierDiscountUpperLimitEther,
      uint256 _thirdTierDiscountUpperLimitEther) public onlyOwner {
        firstTierDiscountUpperLimitEther = _firstTierDiscountUpperLimitEther;
        secondTierDiscountUpperLimitEther = _secondTierDiscountUpperLimitEther;
        thirdTierDiscountUpperLimitEther = _thirdTierDiscountUpperLimitEther;
    }

    function isPreSaleOpen()
      internal
      returns (bool)
    {
      return !paused && !closed;
    }

    /// @notice This function fires when someone sends Ether to the address of this contract.
    /// The ETH will be exchanged for SHP and it ensures contributions cannot be made from known addresses.
    function ()
      public
      payable
      notClosed
      notPaused
    {

      Contribution(msg.value, msg.sender);

      require(
        msg.sender != etherEscrowAddress &&
        msg.sender != reserveAddress &&
        msg.sender != founderAddress &&
        msg.sender != presaleAddress);

      bool preSaleOpen = isPreSaleOpen();

      require(preSaleOpen);
      require(msg.sender != 0x0);
      require(!isContract(msg.sender));
      require(tx.gasprice <= MAX_GAS_PRICE);

      Contribution(msg.value, msg.sender);

      address caller = safeCaller(msg.sender);

      if (preSaleOpen) {
        processPreSale(caller);
        if (closed) {
          processRefund();
        }
      }
      else {
        revert();
      }
    }

    function processRefund() internal {
      if (refund.amount > 0) {
        refund.refundTo.transfer(refund.amount);
        ContributionRefund(refund.amount, refund.refundTo);
      }
    }

    function processPreSale(
      address caller
    )
      internal
    {
      uint256 allowedContribution = processContribution();
      if (allowedContribution > 0) {
          doBuy(caller, allowedContribution);
      }
      else {
          revert();
      }
    }

    function processContribution() internal isValidContribution returns (uint256) {

      uint256 allowedContribution = msg.value;
      uint256 tillCap = remainingTillCap();
      if (msg.value > tillCap) {
          closed = true;
          allowedContribution = tillCap;
          refund = Refund(msg.sender, msg.value.sub(allowedContribution));
          PresaleClosed(now);
      }

      return allowedContribution;
    }


    /// @notice Ensure the contribution is valid
    /// @return Returns whether the contribution is valid or not
    function validContribution() internal returns (bool) {
      
      // Contributions of any amount will be valid during grace period
      if (gracePeriod) {
          return true;
      }

      bool isContributionValid = msg.value >= minPresaleContributionEther && msg.value <= maxPresaleContributionEther;

      ValidContributionCheck(msg.value, isContributionValid);

      return isContributionValid;
    }


    // function isAffiliateValid()
    //   internal
    //   returns (bool)
    // {
    //     if (msg.data.length > 0) {
    //         address affiliateAddr = bytesToAddress(msg.data);
    //         if (affiliates[affiliateAddr]) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // function getAffiliate()
    //   internal
    //   returns (address)
    // {
    //     return bytesToAddress(msg.data);
    // }

    /// @notice If an affiliate is specified and valid add 1% extra SHP tokens
    /// @param tokens The initial amount of tokens to mint
    /// @return Returns the new amount of tokens (1% more if affiliate valid)
    function applyAffiliate(
      uint256 tokens
    )
      internal
      returns (uint256)
    {
    //   if (isAffiliateValid()) {
    //     return tokens.add(tokens.div(100));
    //   }
      return tokens;
    }

    
    /// @notice Pays an affiliate if they are valid and present in the transaction data
    /// @param tokens The contribution tokens used to calculate affiliate payment amount
    function payAffiliate(
      uint256 tokens
    )
      internal
    {
    //   if (isAffiliateValid()) {
    //     address affiliate = getAffiliate();
    //     uint256 affiliateTokens = getAffiliateAmount(tokens);
    //     assert(shp.generateTokens(affiliate, affiliateTokens));
    //     PreSale(affiliate, 0, affiliateTokens);
    //   }
    }

    /// @notice Applies the discount based on the discount tiers
    /// @param _etherAmount The amount of ether used to evaluate the tier the contribution lies within
    /// @param _contributorTokens The tokens allocated based on the contribution
    function applyDiscount(
      uint256 _etherAmount, 
      uint256 _contributorTokens
    )
      internal
      returns (uint256)
    {
      uint256 discount = 0;

      if (_etherAmount <= firstTierDiscountUpperLimitEther) {
          discount = _contributorTokens.mul(FIRST_TIER_DISCOUNT).div(100);
      } else if (_etherAmount > firstTierDiscountUpperLimitEther && _etherAmount <= secondTierDiscountUpperLimitEther) {
          discount = _contributorTokens.mul(SECOND_TIER_DISCOUNT).div(100);
      } else {
          discount = _contributorTokens.mul(THIRD_TIER_DISCOUNT).div(100);
      }

      DiscountApplied(_etherAmount, _contributorTokens, discount);
      return discount.add(_contributorTokens);
    }

    /// @notice This method sends the Ether received to the Ether escrow address
    /// and generates the calculated number of SHP tokens, sending them to the caller's address.
    /// It also generates the founder's tokens and the reserve tokens at the same time.
    function doBuy(
      address caller,
      uint256 etherAmount
    )
      internal
    {

        uint256 callerTokens = etherAmount.mul(CALLER_EXCHANGE_RATE);
        uint256 callerTokensWithDiscount = applyDiscount(etherAmount, callerTokens);

        uint256 reserveTokens = etherAmount.mul(RESERVE_EXCHANGE_RATE);
        uint256 founderTokens = etherAmount.mul(FOUNDER_EXCHANGE_RATE);

        // TODO: reenable once integration with affiliates
        // uint256 newCallerTokens = applyAffiliate(callerTokens);

        require(shp.generateTokens(caller, callerTokensWithDiscount));
        require(shp.generateTokens(reserveAddress, reserveTokens));
        require(shp.generateTokens(founderAddress, founderTokens));

        payAffiliate(callerTokens);

        NewSale(caller, etherAmount, callerTokensWithDiscount);
        NewSale(reserveAddress, etherAmount, reserveTokens);
        NewSale(founderAddress, etherAmount, founderTokens);

        etherEscrowAddress.transfer(etherAmount);

        updateCounters(etherAmount);
    }

    function remainingTillCap() internal returns (uint256) {
      return preSaleCap.sub(preSaleEtherPaid);
    }

    function updateCounters(uint256 _etherAmount) internal {
        if (!gracePeriod) {
            preSaleEtherPaid = preSaleEtherPaid.add(_etherAmount);
        }
        else {
            gracePeriodEtherPaid = gracePeriodEtherPaid.add(_etherAmount);
        }
        
        totalContributions = totalContributions.add(1);
        CountersUpdated(preSaleEtherPaid, gracePeriodEtherPaid, _etherAmount);
    }

    function finalize() onlyOwner {
        require(getBlockNumber() >= 0);
        require(finalizedBlock == 0);
        finalizedBlock = getBlockNumber();
        finalizedTime = getTime();
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
    function pauseContribution() public payable onlyOwner {
        // TODO: enable
        // ContributionStateChanged(msg.sender, ContributionState.Paused);
        paused = true;
    }

    /// @notice Resumes the contribution
    function resumeContribution() public payable onlyOwner {
        // TODO: enable
        // ContributionStateChanged(msg.sender, ContributionState.Resumed);
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

    //////////
    // MiniMe Controller Interface functions
    //////////

    // In between the offering and the network. Default settings for allowing token transfers.
    function proxyPayment(address) public payable returns (bool) {
        return false;
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return finalizedBlock > 0;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return finalizedBlock > 0;
    }

    //////////
    // Testing specific methods
    //////////

    /// @notice This function is overrided by the test Mocks.
    function getTime() public returns (uint256) {
        return now;
    }
}
