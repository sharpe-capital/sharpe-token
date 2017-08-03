pragma solidity ^0.4.11;

import "./lib/Owned.sol";
import "./lib/strings.sol";
import "./lib/SafeMath.sol";

contract TradeLedger is Owned {

  using strings for *;
  using SafeMath for uint256;

  // Fields - START

  uint256[] private equityPointIds; // list of all equity point IDs
  string[] private positionIds; // list of all position IDs
  string[] private accountIds; // list of all account IDs
  mapping (string => uint256[]) private accountEquityPoints; // list of equity point IDs, keyed by account ID
  mapping (string => string[]) private accountPositions; // list of position IDs, keyed by account ID
  mapping (string => Account) private accounts; // map of accounts, keyed by ID
  mapping (string => Position) private positions; // map of positions, keyed by ID
  mapping (uint256 => EquityPoint) private equityPoints; // map of equity points, keyed by ID
  mapping (string => address) private accountOwners; // map of owners, keyed by account ID
  mapping (string => address) private positionOwners; // map of owners, keyed by position ID 

  // Fields - END



  // Default functions - START

  function () payable {
    require(false);
  }

  function TradeLedger() payable {
    // no initialisation required
  }

  // Default functions - END



  // Modifiers - START

  modifier positionOwner(string id) {
    require(positionOwners[id] == msg.sender);
    _;
  }

  modifier accountOwner(string id) {
    require(accountOwners[id] == msg.sender);
    _;
  }

  modifier positionOpen(string id) {
    require(positions[id].closePrice.toSlice().len() == 0);
    _;
  }

  modifier positionClosed(string id) {
    require(positions[id].closePrice.toSlice().len() > 0);
    _;
  }

  modifier positionNotPresent(string id) {
    require(!positions[id].isPresent);
    _;
  }

  modifier positionPresent(string id) {
    require(positions[id].isPresent);
    _;
  }

  modifier accountNotPresent(string id) {
    require(!accounts[id].isPresent);
    _;
  }

  modifier accountPresent(string id) {
    require(accounts[id].isPresent);
    _;
  }

  modifier equityPointNotPresent(uint256 id) {
    require(!equityPoints[id].isPresent);
    _;
  }

  modifier equityPointPresent(uint256 id) {
    require(equityPoints[id].isPresent);
    _;
  }

  // Modifiers - END



  // Data structures - START

  struct KeyPair {
    string privateKey;
    string publicKey;
    bool released;
  }

  struct Account {
    string id;
    int256 balance;
    int256 equity;
    uint256 leverage;
    int256 profitLoss;
    bool isPresent;
  }

  struct EquityPoint {
    uint256 id;
    string date;
    int256 balance;
    int256 equity;
    uint256 leverage;
    int256 profitLoss;
    string accountId;
    bool isPresent;
  }

  struct Position {
    string id;
    string openPrice; // encrypted
    string closePrice; // encrypted
    string stopPrice; // encrypted
    string limitPrice; // encrypted
    uint256 size;
    uint256 exposure;
    int256 profitLoss;
    string openDate;
    string closeDate;
    string ticker; // encrypted
    KeyPair keyPair;
    bool isPresent;
    string accountId;
  }

  // Data structures - END



  // Restricted functions - START
  // ...
  // Restricted functions - END



  // Public functions - START

  /// @dev Releases the public/privatey key pair that were used to encrypt sensitive Position information
  /// @param id Position ID - should be unique and provided by brokerage firm
  /// @param privateKey RSA private key used to decrypt position
  /// @param publicKey RSA public key used to encrypt position
  function releaseKeyPair(
    string id, 
    string privateKey, 
    string publicKey
  ) 
    positionOwner(id) // Only the position owner can release decryption keys
  {
    Position position = positions[id];
    if(!position.keyPair.released && position.closeDate.toSlice().len() > 0) {
      positions[id].keyPair = KeyPair(privateKey, publicKey, true);
    }
  }

  /// @dev Returns the number of positions for an account
  /// @param accountId Account ID - should be unique and provided by brokerage firm
  /// @return Returns the number of positions for an account
  function countAccountPositions(
    string accountId
  ) 
    accountPresent(accountId) // Only allow for valid account IDs
    returns (uint256) 
  {
    return accountPositions[accountId].length;
  }

  /// @dev Returns the number of equity points for an account
  /// @param accountId Account ID - should be unique and provided by brokerage firm
  /// @return Returns the number of equity points for an account
  function countAccountEquityPoints(
    string accountId
  ) 
    accountPresent(accountId) // Only allow for valid account IDs
    returns (uint256) 
  {
    return accountEquityPoints[accountId].length;
  }

  /// @dev Closes a position and updates the account P/L
  /// @param id Position ID - should be unique and provided by brokerage firm
  /// @param closePrice Closing price of the underlying asset
  /// @param closeDate Closing date of the position
  /// @param profitLoss Net profit/loss of the position
  /// @return Returns the number of positions for an account
  function closePosition(
    string id, 
    string closePrice, 
    string closeDate, 
    int256 profitLoss,
    string currentDateTime
  ) 
    positionOwner(id) // Only the position owner can close positions
    positionOpen(id) // Only open positions can be closed
    positionPresent(id) // Only valid positions can be closed
  {
    string accountId = positions[id].accountId;
    Account memory account = accounts[accountId];
    int256 previousProfitLoss = positions[id].profitLoss;
    positions[id].closePrice = closePrice;
    positions[id].closeDate = closeDate;
    positions[id].profitLoss = profitLoss;
    accounts[accountId].equity -= previousProfitLoss;
    accounts[accountId].equity += profitLoss;
    accounts[accountId].balance += profitLoss;
    updateAccountLeverage(accountId);
    addEquityPoint(accountId, account.balance, account.equity, account.leverage, account.profitLoss, currentDateTime);
  }

  function updatePosition(
    string id, 
    int256 profitLoss,
    string currentDateTime
  ) 
    positionOpen(id)
    positionOwner(id) 
    positionPresent(id)
  {
    int256 previousProfitLoss = positions[id].profitLoss;
    string accountId = positions[id].accountId;
    Account memory account = accounts[accountId];
    positions[id].profitLoss = profitLoss;
    accounts[accountId].equity -= previousProfitLoss;
    accounts[accountId].equity += profitLoss;
    addEquityPoint(accountId, account.balance, account.equity, account.leverage, account.profitLoss, currentDateTime);
  }

  function updateAccountLeverage(
    string accountId
  ) 
    accountOwner(accountId)
    accountPresent(accountId)
  {
    // TODO - update the accounts leverage based on position data and deposited funds
  }

  function addEquityPoint(
    string accountId, 
    int256 balance,
    int256 equity,
    uint256 leverage,
    int256 profitLoss,
    string currentDateTime
  )
    accountOwner(accountId)
  {
    uint256 id = equityPointIds.length + 1;
    if(!equityPoints[id].isPresent) {
      equityPoints[id] = EquityPoint(id, currentDateTime, balance, equity, leverage, profitLoss, accountId, true);
      equityPointIds.push(id);
      accountEquityPoints[accountId].push(id);
    }
  }

  function addPosition(
    string id,
    string openPrice,
    string stopPrice,
    string limitPrice,
    uint256 size,
    uint256 exposure,
    string openDate,
    string ticker,
    string accountId
  ) 
    accountOwner(accountId)
    accountPresent(accountId)
    positionNotPresent(id) 
  {
    
    require(openPrice.toSlice().len() > 0);
    require(ticker.toSlice().len() > 0);
    require(accountId.toSlice().len() > 0);
    require(openDate.toSlice().len() > 0);
    require(id.toSlice().len() > 0);
    require(accountId.toSlice().len() > 0);
    require(size > 0);
    require(exposure > 0);

    Position memory position = Position(
      id,
      openPrice,
      '',
      stopPrice,
      limitPrice,
      size,
      exposure,
      0,
      openDate,
      '',
      ticker,
      KeyPair('TBC', 'TBC', false),
      true,
      accountId
    );
    accountPositions[accountId].push(id);
    positionIds.push(id);
    positionOwners[id] = msg.sender;
    positions[id] = position;
    updateAccountLeverage(accountId);
  }

  function countPositions() returns (uint256) {
    return positionIds.length;
  }

  function countAccounts() returns (uint256) {
    return accountIds.length;
  }

  function countEquityPoints() returns (uint256) {
    return equityPointIds.length;
  }

  function getAccount(
    string id
  ) 
    accountPresent(id)
    returns (string, int256, int256, uint256, int256) 
  {
    Account account = accounts[id];
    return (account.id, account.balance, account.equity, account.leverage, account.profitLoss);
  }

  function addAccount(
    string id,
    int256 balance
  )
    accountNotPresent(id)
  {
    saveAccount(id, balance, balance, 0, 0);
  }

  function getPositionByIndex(
    string accountId, 
    uint256 idx
  ) 
    accountPresent(accountId)
    returns (string, string, uint256, int256, string, string, string) 
  {
    string posid = accountPositions[accountId][idx];
    require(posid.toSlice().len() > 0);
    return getPosition(posid);
  }

  function getEquityPointByIndex(
    string accountId, 
    uint256 idx
  ) 
    accountPresent(accountId)
    returns (string, int256, int256, uint256, int256)
  {
    uint256 epid = accountEquityPoints[accountId][idx];
    require(epid > 0);
    return getEquityPoint(epid);
  }

  function getPositionKeysByIndex(
    string accountId, 
    uint256 idx
  ) 
    accountPresent(accountId)
    returns (string, string) 
  {
    string posid = accountPositions[accountId][idx];
    require(posid.toSlice().len() > 0);
    return getPositionKeys(posid);
  }

  function getPosition(
    string id
  ) 
    positionPresent(id)
    returns (string, string, uint256, int256, string, string, string) 
  {
    Position position = positions[id];
    return (
      position.openPrice, 
      position.closePrice,
      position.size,
      position.profitLoss,
      position.openDate,
      position.closeDate,
      position.ticker
    );
  }

  function getEquityPoint(
    uint256 id
  ) 
    equityPointPresent(id)
    returns (string, int256, int256, uint256, int256) 
  {
    EquityPoint equityPoint = equityPoints[id];
    return (
      equityPoint.date, 
      equityPoint.balance,
      equityPoint.equity,
      equityPoint.leverage,
      equityPoint.profitLoss
    );
  }

  function getPositionKeys(
    string id
  ) 
    positionPresent(id)
    returns (string, string) 
  {
    Position position = positions[id];
    return (
      position.keyPair.privateKey,
      position.keyPair.publicKey
    );
  }

  // Public functions - END



  // Internal functions - START

  function saveAccount(
    string id, 
    int256 balance, 
    int256 equity,  
    uint256 leverage, 
    int256 profitLoss
  ) 
    internal 
    accountNotPresent(id)
  {
    accountOwners[id] = msg.sender;
    accountIds.push(id);
    accounts[id] = Account(id, balance, equity, leverage, profitLoss, true);
  }

  // Internal functions - END
}