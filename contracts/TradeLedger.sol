pragma solidity ^0.4.11;

import "./lib/Owned.sol";
import "./lib/SafeMath.sol";

/// @title Trading ledger - Stores a record of investment activity and fund performance over time
/// @author Lewis Barber - <lewis@sharpe.capital>
contract TradeLedger is Owned {

  using SafeMath for uint256;

  uint256[] private equityPointIds;                           // List of all equity point IDs
  string[] private positionIds;                               // List of all position IDs
  string[] private accountIds;                                // List of all account IDs
  mapping (string => uint256[]) private accountEquityPoints;  // List of equity point IDs, keyed by account ID
  mapping (string => string[]) private accountPositions;      // List of position IDs, keyed by account ID
  mapping (string => Account) private accounts;               // Map of accounts, keyed by ID
  mapping (string => Position) private positions;             // Map of positions, keyed by ID
  mapping (uint256 => EquityPoint) private equityPoints;      // Map of equity points, keyed by ID
  mapping (string => address) private accountOwners;          // Map of owners, keyed by account ID
  mapping (string => address) private positionOwners;         // Map of owners, keyed by position ID 

  /// @notice Rejects Ether payments and returns the funds to the sender
  function () payable {
    require(false);
  }

  /// @notice Ensures the specified position is owned by the caller of the function
  /// @param id The position ID
  modifier positionOwner(string id) {
    require(positionOwners[id] == msg.sender);
    _;
  }

  /// @notice Ensures the specified account is owned by the caller of the function
  /// @param id The account ID
  modifier accountOwner(string id) {
    require(accountOwners[id] == msg.sender);
    _;
  }

  /// @notice Ensures the specified position is open
  /// @param id The position ID
  modifier positionOpen(string id) {
    require(positions[id].closePrice == 0);
    _;
  }

  /// @notice Ensures the specified position is closed
  /// @param id The position ID
  modifier positionClosed(string id) {
    require(positions[id].closePrice > 0);
    _;
  }

  /// @notice Ensures the specified position does not exist
  /// @param id The position ID
  modifier positionNotPresent(string id) {
    require(!positions[id].isPresent);
    _;
  }

  /// @notice Ensures the specified position exists
  /// @param id The position ID
  modifier positionPresent(string id) {
    require(positions[id].isPresent);
    _;
  }

  /// @notice Ensures the specified account does not exist
  /// @param id The account ID
  modifier accountNotPresent(string id) {
    require(!accounts[id].isPresent);
    _;
  }

  /// @notice Ensures the specified account exists
  /// @param id The account ID
  modifier accountPresent(string id) {
    require(accounts[id].isPresent);
    _;
  }

  /// @notice Ensures the specified equity point does not exist
  /// @param id The equity point ID
  modifier equityPointNotPresent(uint256 id) {
    require(!equityPoints[id].isPresent);
    _;
  }

  /// @notice Ensures the specified equity point exists
  /// @param id The equity point ID
  modifier equityPointPresent(uint256 id) {
    require(equityPoints[id].isPresent);
    _;
  }

  /// @notice Object structure for an RSA key pair
  struct KeyPair {
    string privateKey;
    string publicKey;
    bool released;
  }

  /// @notice Object structure for a trading account
  struct Account {
    string id;
    int256 balance;
    int256 equity;
    int256 leverage; // Stored as x100 to handle no floating points and 2 decimal place accuracy
    int256 profitLoss;
    bool isPresent;
  }

  /// @notice Object structure representing a trading account at a given point in time
  struct EquityPoint {
    uint256 id;
    string date;
    int256 balance;
    int256 equity;
    int256 leverage; // Stored as x100 to handle no floating points and 2 decimal place accuracy
    int256 profitLoss;
    string accountId;
    bool isPresent;
  }

  /// @notice Object structure for a position (trade) in a trading account
  struct Position {
    string id;
    string openPrice; // encrypted
    uint256 closePrice;
    string stopPrice; // encrypted
    string limitPrice; // encrypted
    string size; // encrypted
    int256 exposure;
    int256 profitLoss;
    string openDate; // encrypted
    string closeDate;
    string ticker; // encrypted
    KeyPair keyPair;
    bool isPresent;
    string accountId;
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
  /// @param privateKey RSA private key used to decrypt position
  /// @param publicKey RSA public key used to encrypt position
  /// @return Returns the number of positions for an account
  function closePosition(
    string id, 
    uint256 closePrice, 
    string closeDate, 
    int256 profitLoss,
    string privateKey, 
    string publicKey
  ) 
    positionOwner(id)   // Only the position owner can close positions
    positionOpen(id)    // Only open positions can be closed
    positionPresent(id) // Only valid positions can be closed
  {
    string accountId = positions[id].accountId;
    Account memory account = accounts[accountId];
    int256 previousProfitLoss = positions[id].profitLoss;
    positions[id].closePrice = closePrice;
    positions[id].closeDate = closeDate;
    positions[id].profitLoss = profitLoss;
    positions[id].keyPair = KeyPair(privateKey, publicKey, true);
    accounts[accountId].equity -= previousProfitLoss;
    accounts[accountId].equity += profitLoss;
    accounts[accountId].balance += profitLoss;
    updateAccountLeverage(accountId);
    addEquityPoint(accountId, account.balance, account.equity, account.leverage, account.profitLoss, closeDate);
  }

  /// @dev Updates a positions P/L and adds a new equity point for the account
  /// @param id Position ID - should be unique and provided by brokerage firm
  /// @param profitLoss The current P/L of the position
  /// @param currentDateTime The current date & time in ISO format
  function updatePosition(
    string id, 
    int256 profitLoss,
    string currentDateTime
  ) 
    positionOpen(id)    // Only open positions can be updated
    positionOwner(id)   // Only the position owner can update positions
    positionPresent(id) // Only valid positions can be updated
  {
    int256 previousProfitLoss = positions[id].profitLoss;
    string accountId = positions[id].accountId;
    Account memory account = accounts[accountId];
    positions[id].profitLoss = profitLoss;
    accounts[accountId].equity -= previousProfitLoss;
    accounts[accountId].equity += profitLoss;
    accounts[accountId].profitLoss = accounts[accountId].equity - accounts[accountId].balance;
    updateAccountLeverage(accountId);
    account = accounts[accountId];
    addEquityPoint(accountId, account.balance, account.equity, account.leverage, account.profitLoss, currentDateTime);
  }

  /// @dev Updates a the current leverage on an account, across all open positions
  /// @param accountId Account ID - should be unique and provided by brokerage firm
  function updateAccountLeverage(
    string accountId
  ) 
    accountOwner(accountId)   // Only the account owner can update the leverage
    accountPresent(accountId) // Only valid accounts can be updated
  {
    Account account = accounts[accountId];
    int256 exposure = 0;
    uint256 count = countAccountPositions(accountId);
    for(uint256 i=0; i<count; i++) {
      int256 positionExposure = getPositionExposureByIndex(accountId, i);
      exposure = exposure + positionExposure;
    }
    exposure = exposure * 100;
    int256 leverage = exposure / account.equity;
    accounts[accountId].leverage = leverage;
  }

  /// @dev Adds an equity point for the specified account at a specific point in time
  /// @param accountId Account ID - should be unique and provided by brokerage firm
  /// @param balance The account's cleared balance
  /// @param equity The account's equity (balance + profitLoss)
  /// @param leverage The total leverage across all open positions 
  /// @param profitLoss The profit and loss at this point in time
  /// @param currentDateTime The current date & time in ISO format
  function addEquityPoint(
    string accountId, 
    int256 balance,
    int256 equity,
    int256 leverage,
    int256 profitLoss,
    string currentDateTime
  )
    internal
    accountOwner(accountId) // Only the account owner can add equity points
  {
    uint256 id = equityPointIds.length + 1;
    if(!equityPoints[id].isPresent) {
      equityPoints[id] = EquityPoint(id, currentDateTime, balance, equity, 
        leverage, profitLoss, accountId, true);
      equityPointIds.push(id);
      accountEquityPoints[accountId].push(id);
    }
  }

  /// @dev Adds a new open position against the specified account, certain details will be RSA
  //  encrypted and the private key will be released once the position has been closed
  /// @param id ID - should be unique and provided by brokerage firm
  /// @param openPrice The position open price, RSA encrypted & base64 encoded
  /// @param stopPrice The position stop price, RSA encrypted & base64 encoded
  /// @param limitPrice The position limit price, RSA encrypted & base64 encoded
  /// @param size The position size
  /// @param exposure The notional amount for the position (asset price x size)
  /// @param openDate The date the position was opened
  /// @param ticker The position ticker, RSA encrypted & base64 encoded
  /// @param accountId Account ID - should be unique and provided by brokerage firm
  function addPosition(
    string id, string openPrice, string stopPrice, string limitPrice,
    string size, int256 exposure, string openDate, string ticker, string accountId
  ) 
    accountOwner(accountId)   // Only the account owner can add positions
    accountPresent(accountId) // Only valid accounts can store positions
    positionNotPresent(id)    // Stops duplicate position IDs
  {

    require(bytes(openPrice).length > 0 && bytes(ticker).length > 0 && bytes(accountId).length > 0);
    require(bytes(openDate).length > 0 && bytes(id).length > 0);
    require(bytes(size).length > 0 && exposure > 0);

    Position memory position = Position(id, openPrice, 0, stopPrice, 
      limitPrice, size, exposure, 0, openDate, "", ticker, 
      KeyPair("TBC", "TBC", false), true, accountId
    );

    accountPositions[accountId].push(id);
    positionIds.push(id);
    positionOwners[id] = msg.sender;
    positions[id] = position;
    updateAccountLeverage(accountId);
  }

  /// @dev Counts all positions
  /// @return Returns the number of positions
  function countPositions() returns (uint256) {
    return positionIds.length;
  }

  /// @dev Counts all accounts
  /// @return Returns the number of accounts
  function countAccounts() returns (uint256) {
    return accountIds.length;
  }

  /// @dev Counts all equity points
  /// @return Returns the number of equity points
  function countEquityPoints() returns (uint256) {
    return equityPointIds.length;
  }

  /// @dev Gets an account by ID
  /// @param id Account ID - should be unique and provided by the brokerage
  /// @return Returns the account fields as an array of values
  function getAccount(
    string id
  ) 
    accountPresent(id)  // Only valid accounts can be retreived
    returns (string, int256, int256, int256, int256) 
  {
    Account account = accounts[id];
    return (account.id, account.balance, account.equity, account.leverage, account.profitLoss);
  }

  /// @dev Adds a new account
  /// @param id Account ID - should be unique and provided by the brokerage
  /// @param balance The starting balance of the account
  function addAccount(
    string id,
    int256 balance
  )
    accountNotPresent(id) // Prevents duplicate account IDs
  {
    accountOwners[id] = msg.sender;
    accountIds.push(id);
    accounts[id] = Account(id, balance, balance, 0, 0, true);
  }

  /// @dev Gets an account by index
  /// @param idx The account index
  /// @return Returns the account fields as an array of values
  function getAccountByIndex(
    uint256 idx
  )
    returns (string, int256, int256, int256, int256) 
  {
    string accid = accountIds[idx];
    require(bytes(accid).length > 0);
    return getAccount(accid);
  }

  /// @dev Gets an account position by index
  /// @param accountId Account ID - should be unique and provided by the brokerage
  /// @param idx The position index
  /// @return Returns the position fields as an array of values
  function getPositionByIndex(
    string accountId, 
    uint256 idx
  ) 
    accountPresent(accountId) // Only valid accounts can be provided
    returns (string, uint256, string, int256, string, string, string) 
  {
    string posid = accountPositions[accountId][idx];
    require(bytes(posid).length > 0);
    return getPosition(posid);
  }

  /// @dev Gets an account equity point by index
  /// @param accountId Account ID - should be unique and provided by the brokerage
  /// @param idx The position index
  /// @return Returns the equity point fields as an array of values
  function getEquityPointByIndex(
    string accountId, 
    uint256 idx
  ) 
    accountPresent(accountId) // Only valid accounts can be provided
    returns (string, int256, int256, int256, int256)
  {
    uint256 epid = accountEquityPoints[accountId][idx];
    require(epid > 0);
    return getEquityPoint(epid);
  }

  /// @dev Gets an account position key pair by index
  /// @param accountId Account ID - should be unique and provided by the brokerage
  /// @param idx The position index
  /// @return Returns the key pair fields as an array of values
  function getPositionKeysByIndex(
    string accountId, 
    uint256 idx
  ) 
    accountPresent(accountId) // Only valid accounts can be provided
    returns (string, string) 
  {
    string posid = accountPositions[accountId][idx];
    require(bytes(posid).length > 0);
    return getPositionKeys(posid);
  }

  /// @dev Gets an position by ID
  /// @param id Position ID - should be unique and provided by the brokerage
  /// @return Returns the position fields as an array of values
  function getPosition(
    string id
  ) 
    positionPresent(id) // Only valid positions can be provided
    returns (string, uint256, string, int256, string, string, string) 
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

  /// @dev Gets an equity point by ID
  /// @param id Equity Point ID
  /// @return Returns the equity point fields as an array of values
  function getEquityPoint(
    uint256 id
  ) 
    equityPointPresent(id)  // Only valid equity points can be provided
    returns (string, int256, int256, int256, int256) 
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

  /// @dev Gets an position key by ID
  /// @param id Position ID
  /// @return Returns the key pair fields as an array of values
  function getPositionKeys(
    string id
  ) 
    positionPresent(id) // Only valid positions can be provided
    returns (string, string) 
  {
    Position position = positions[id];
    return (
      position.keyPair.privateKey,
      position.keyPair.publicKey
    );
  }

  /*
   * Internal functions
   */
  /// @dev Gets an position exposure by account and index
  /// @param accountId Account ID - should be unique and provided by the brokerage
  /// @param idx The index of the position
  /// @return Returns the exposure of the position
  function getPositionExposureByIndex(
    string accountId, 
    uint256 idx
  ) 
    accountPresent(accountId) // Only valid accounts can be provided
    internal
    returns (int256) 
  {
    string posid = accountPositions[accountId][idx];
    require(bytes(posid).length > 0);
    return positions[posid].exposure;
  }
}