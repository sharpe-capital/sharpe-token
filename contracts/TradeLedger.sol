pragma solidity ^0.4.11;

import "./lib/Owned.sol";
import "./lib/strings.sol";

contract TradeLedger is Owned {

  using strings for *;

  // Fields - START

  string[] private equityPointIds; // list of all equity point IDs
  string[] private positionIds; // list of all position IDs
  string[] private accountIds; // list of all account IDs
  mapping (string => string[]) private accountEquityPoints; // list of equity point IDs, keyed by account ID
  mapping (string => string[]) private accountPositions; // list of position IDs, keyed by account ID
  mapping (string => Account) private accounts; // map of accounts, keyed by ID
  mapping (string => Position) private positions; // map of positions, keyed by ID
  mapping (string => EquityPoint) private equityPoints; // map of equity points, keyed by ID
  mapping (string => address) private accountOwners; // map of owners, keyed by account ID
  mapping (string => address) private positionOwners; // map of owners, keyed by position ID 

  // Fields - END



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

  // Modifiers - END



  // Data structures - START

  struct KeyPair {
    string privateKey;
    string publicKey;
    bool released;
  }

  struct EquityPoint {
    string id;
    string date;
    uint256 balance;
    uint256 equity;
    uint256 deposit;
    uint256 leverage;
    int256 profitLoss;
    string accountId;
  }

  struct Account {
    string id;
    uint256 balance;
    uint256 equity;
    uint256 deposit;
    uint256 leverage;
    int256 profitLoss;
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
  }

  // Data structures - END



  // Restricted functions - START
  // ...
  // Restricted functions - END



  // Public functions - START

  function releaseKeyPair(
    string accountId, 
    string privateKey, 
    string publicKey
  ) 
    accountOwner(accountId) 
  {

    string[] accountPos = accountPositions[accountId];

    for(uint idx=0; idx<accountPos.length; idx++) {
      
      string posid = accountPos[idx];
      Position position = positions[posid];

      if(!position.keyPair.released && position.closeDate.toSlice().len() > 0) {
        positions[posid].keyPair = KeyPair(privateKey, publicKey, true);
      }
    }
  }

  function countAccountPositions(
    string accountId
  ) 
    accountPresent(accountId)
    returns (uint256) 
  {
    return accountPositions[accountId].length;
  }

  function closePosition(
    string id, 
    string closePrice, 
    string closeDate, 
    int256 profitLoss
  ) 
    positionOwner(id)
    positionOpen(id)
    positionPresent(id)
  {
    positions[id].closePrice = closePrice;
    positions[id].closeDate = closeDate;
    positions[id].profitLoss = profitLoss;
    // TODO - update account balance??
  }

  function updatePosition(
    string id, 
    int256 profitLoss
  ) 
    positionOpen(id)
    positionOwner(id) 
    positionPresent(id)
  {
    positions[id].profitLoss = profitLoss;
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
      true
    );
    accountPositions[accountId].push(id);
    positionIds.push(id);
    positionOwners[id] = msg.sender;
    positions[id] = position;
  }

  function countPositions() returns (uint256) {
    return positionIds.length;
  }

  function countAccounts() returns (uint256) {
    return accountIds.length;
  }

  function getAccount(
    string id
  ) 
    accountPresent(id)
    returns (string, uint256, uint256, uint256, uint256, int256) 
  {
    Account account = accounts[id];
    return (account.id, account.balance, account.equity, account.deposit, account.leverage, account.profitLoss);
  }

  function addAccount(
    string id,
    uint256 balance
  )
    accountNotPresent(id)
  {
    saveAccount(id, balance, balance, 0, 0, 0);
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
    uint256 balance, 
    uint256 equity, 
    uint256 deposit, 
    uint256 leverage, 
    int256 profitLoss) internal {

    if(!accounts[id].isPresent) {
      accountOwners[id] = msg.sender;
      accountIds.push(id);
    } else {
      require(accountOwners[id] == msg.sender);
    }
    accounts[id] = Account(id, balance, equity, deposit, leverage, profitLoss, true);
  }

  // Internal functions - END



  // Default functions - START

  function () payable {
    require(false);
  }

  function TradeLedger() payable {
    // todo - initialise
  }

  // Default functions - END

  
}