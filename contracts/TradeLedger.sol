pragma solidity ^0.4.11;

import "./lib/Owned.sol";

contract TradeLedger is Owned {

  string[] private positionIds;
  string[] private accountIds;
  // mapping (address => string[]) private addressAccountIds;
  mapping (string => Account) private accounts;
  mapping (string => Position[]) private positions;

  function TradeLedger() payable {
    // todo - initialise
  }

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
    positions[accountId].push(
      Position(
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
      )
    );
  }

  function countPositions(string accountId) returns (uint256) {
    return positions[accountId].length;
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

  function releaseKeyPair(string privateKey, string publicKey) onlyOwner {
    for(uint x=0; x<accountIds.length; x++) {
      string id = accountIds[x];
      Position[] accountPositions = positions[id];
      for(uint y=0; y<accountPositions.length; y++) {
        accountPositions[y].keyPair = KeyPair(privateKey, publicKey);
      }
    }
  }

  function () payable {
    require(false);
  }
}