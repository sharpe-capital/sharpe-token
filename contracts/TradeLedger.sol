pragma solidity ^0.4.11;

import "./lib/Owned.sol";

contract TradeLedger is Owned {

  // Fields - START

  string[] private positionIds;
  string[] private accountIds;
  mapping (string => Account) private accounts;
  mapping (string => Position) private positions;
  mapping (string => Position[]) private accountPositions;

  // Fields - END



  // Data structures - START

  struct KeyPair {
    string privateKey;
    string publicKey;
  }

  struct Account {
    string id;
    uint256 balance;
    uint256 equity;
    uint256 deposit;
    uint256 leverage;
    uint256 profitLoss;
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
    string openDate;
    string closeDate;
    string ticker; // encrypted
    KeyPair keyPair;
  }

  // Data structures - END



  // Restricted functions - START

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
  ) onlyOwner {
    
    require(accounts[accountId].isPresent);
    Position memory position = Position(
      id,
      openPrice,
      '',
      stopPrice,
      limitPrice,
      size,
      exposure,
      openDate,
      '',
      ticker,
      KeyPair('TBC', 'TBC')
    );
    positionIds.push(id);
    accountPositions[accountId].push(position);
    positions[id] = position;
  }

  function releaseKeyPair(string privateKey, string publicKey) onlyOwner {

    for(uint x=0; x<accountIds.length; x++) {

      string accid = accountIds[x];
      Position[] accountPos = accountPositions[accid];

      for(uint y=0; y<accountPos.length; y++) {
        accountPos[y].keyPair = KeyPair(privateKey, publicKey);
      }
    }

    for(uint a=0; a<positionIds.length; a++) {
      string posid = positionIds[a];
      positions[posid].keyPair = KeyPair(privateKey, publicKey);
    }
  }

  // Restricted functions - END



  // Public functions - START

  function countAccountPositions(string accountId) returns (uint256) {
    return accountPositions[accountId].length;
  }

  function countPositions() returns (uint256) {
    return positionIds.length;
  }

  function countAccounts() returns (uint256) {
    return accountIds.length;
  }

  function getAccount(string id) returns (string, uint256, uint256, uint256, uint256, uint256) {
    Account account = accounts[id];
    return (account.id, account.balance, account.equity, account.deposit, account.leverage, account.profitLoss);
  }

  function addAccount(string id) {
    saveAccount(id, 0, 0, 0, 0, 0);
  }

  function getPosition(string id) returns (string, string, string) {
    Position position = positions[id];
    return (position.id, position.keyPair.privateKey, position.keyPair.publicKey);
  }

  // Public functions - END



  // Internal functions - START

  function saveAccount(
    string id, 
    uint256 balance, 
    uint256 equity, 
    uint256 deposit, 
    uint256 leverage, 
    uint256 profitLoss) internal {

    if(!accounts[id].isPresent) {
      accountIds.push(id);
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