pragma solidity ^0.4.11;

import "./lib/Owned.sol";
import "./lib/strings.sol";
import "./lib/SafeMath.sol";

contract EquityPointFactory is Owned {

  using strings for *;
  using SafeMath for uint256;

  uint256[] private equityPointIds; // list of all equity point IDs
  mapping (string => uint256[]) private accountEquityPoints; // list of equity point IDs, keyed by account ID
  mapping (uint256 => EquityPoint) private equityPoints; // map of equity points, keyed by ID

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

  function addEquityPoint(
    string accountId, 
    int256 balance,
    int256 equity,
    uint256 leverage,
    int256 profitLoss,
    string currentDateTime
  ) {
    uint256 id = equityPointIds.length + 1;
    if(!equityPoints[id].isPresent) {
      equityPoints[id] = EquityPoint(id, currentDateTime, balance, equity, leverage, profitLoss, accountId, true);
      equityPointIds.push(id);
      accountEquityPoints[accountId].push(id);
    }
  }
}