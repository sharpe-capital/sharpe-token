pragma solidity ^0.4.6;

contract SentimentAnalysis {

  mapping (address => Score[]) scores; // to be initialised as empty array for each address

  struct Score {
    string ticker;
    uint8 scoreOneDay;
    uint8 scoreOneWeek;
    uint8 scoreOneMonth;
    uint8 scoreThreeMonths;
    uint8 scoreSixMonths;
    uint8 scoreOneYear;
    uint8 reputation;
    string dateProvided;
  }

  function ()  payable {
    require(1 == 0);
  }
}