pragma solidity 0.4.15;

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

 
import "./lib/SafeMath.sol";
import "./lib/Owned.sol";
import "./lib/Trustee.sol";
import "./SHP.sol";


contract TokenSale is Owned, TokenController {
    using SafeMath for uint256;
    
    SHP public shp;
    Trustee public trustee;

    address public etherEscrowAddress;
    address public bountyAddress;
    address public trusteeAddress;

    uint256 public founderTokenCount = 0;
    uint256 public reserveTokenCount = 0;
    uint256 public shpExchangeRate = 0;

    uint256 constant public CALLER_EXCHANGE_SHARE = 40;
    uint256 constant public RESERVE_EXCHANGE_SHARE = 30;
    uint256 constant public FOUNDER_EXCHANGE_SHARE = 20;
    uint256 constant public BOUNTY_EXCHANGE_SHARE = 10;
    uint256 constant public MAX_GAS_PRICE = 50000000000;

    bool public paused;
    bool public closed;
    bool public allowTransfer;

    mapping(address => bool) public approvedAddresses;

    event Contribution(uint256 etherAmount, address _caller);
    event NewSale(address indexed caller, uint256 etherAmount, uint256 tokensGenerated);
    event SaleClosed(uint256 when);
    
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

    function setShpExchangeRate(uint256 _shpExchangeRate) public onlyOwner {
        shpExchangeRate = _shpExchangeRate;
    }

    function setAllowTransfer(bool _allowTransfer) public onlyOwner {
        allowTransfer = _allowTransfer;
    }

    /// @notice This method sends the Ether received to the Ether escrow address
    /// and generates the calculated number of SHP tokens, sending them to the caller's address.
    /// It also generates the founder's tokens and the reserve tokens at the same time.
    function doBuy(
        address _caller,
        uint256 etherAmount
    )
        internal
    {

        Contribution(etherAmount, _caller);

        uint256 callerExchangeRate = shpExchangeRate.mul(CALLER_EXCHANGE_SHARE).div(100);
        uint256 reserveExchangeRate = shpExchangeRate.mul(RESERVE_EXCHANGE_SHARE).div(100);
        uint256 founderExchangeRate = shpExchangeRate.mul(FOUNDER_EXCHANGE_SHARE).div(100);
        uint256 bountyExchangeRate = shpExchangeRate.mul(BOUNTY_EXCHANGE_SHARE).div(100);

        uint256 callerTokens = etherAmount.mul(callerExchangeRate);
        uint256 callerTokensWithDiscount = applyDiscount(etherAmount, callerTokens);

        uint256 reserveTokens = etherAmount.mul(reserveExchangeRate);
        uint256 founderTokens = etherAmount.mul(founderExchangeRate);
        uint256 bountyTokens = etherAmount.mul(bountyExchangeRate);
        uint256 vestingTokens = founderTokens.add(reserveTokens);

        founderTokenCount = founderTokenCount.add(founderTokens);
        reserveTokenCount = reserveTokenCount.add(reserveTokens);

        shp.generateTokens(_caller, callerTokensWithDiscount);
        shp.generateTokens(bountyAddress, bountyTokens);
        shp.generateTokens(trusteeAddress, vestingTokens);

        NewSale(_caller, etherAmount, callerTokensWithDiscount);
        NewSale(trusteeAddress, etherAmount, vestingTokens);
        NewSale(bountyAddress, etherAmount, bountyTokens);

        etherEscrowAddress.transfer(etherAmount);
        updateCounters(etherAmount);
    }

    /// @notice Allows the owner to manually mint some SHP to an address if something goes wrong
    /// @param _tokens the number of tokens to mint
    /// @param _destination the address to send the tokens to
    function mintTokens(
        uint256 _tokens, 
        address _destination
    ) 
        onlyOwner 
    {
        shp.generateTokens(_destination, _tokens);
        NewSale(_destination, 0, _tokens);
    }

    /// @notice Applies the discount based on the discount tiers
    /// @param _etherAmount The amount of ether used to evaluate the tier the contribution lies within
    /// @param _contributorTokens The tokens allocated based on the contribution
    function applyDiscount(uint256 _etherAmount, uint256 _contributorTokens) internal constant returns (uint256);

    /// @notice Updates the counters for the amount of Ether paid
    /// @param _etherAmount the amount of Ether paid
    function updateCounters(uint256 _etherAmount) internal;
    
    /// @notice Parent constructor. This needs to be extended from the child contracts
    /// @param _etherEscrowAddress the address that will hold the crowd funded Ether
    /// @param _bountyAddress the address that will hold the bounty scheme SHP
    /// @param _trusteeAddress the address that will hold the vesting SHP
    /// @param _shpExchangeRate the initial SHP exchange rate
    function TokenSale (
        address _etherEscrowAddress,
        address _bountyAddress,
        address _trusteeAddress,
        uint256 _shpExchangeRate
    ) {
        etherEscrowAddress = _etherEscrowAddress;
        bountyAddress = _bountyAddress;
        trusteeAddress = _trusteeAddress;
        shpExchangeRate = _shpExchangeRate;
        trustee = Trustee(_trusteeAddress);
        paused = true;
        closed = false;
        allowTransfer = false;
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
        require(_tokenController != 0x0);
        require(_trusteeOwner != 0x0);
        shp.changeController(_tokenController);
        trustee.changeOwner(_trusteeOwner);
    }

    /// @notice Internal function to determine if an address is a contract
    /// @param _caller The address being queried
    /// @return True if `caller` is a contract
    function isContract(address _caller) internal constant returns (bool) {
        uint size;
        assembly { size := extcodesize(_caller) }
        return size > 0;
    }

    /// @notice Pauses the contribution if there is any issue
    function pauseContribution() public onlyOwner {
        paused = true;
    }

    /// @notice Resumes the contribution
    function resumeContribution() public onlyOwner {
        paused = false;
    }

    //////////
    // MiniMe Controller Interface functions
    //////////

    // In between the offering and the network. Default settings for allowing token transfers.
    function proxyPayment(address) public payable returns (bool) {
        return allowTransfer;
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return allowTransfer;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return allowTransfer;
    }
}