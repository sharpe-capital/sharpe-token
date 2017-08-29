pragma solidity ^0.4.11;

import "./lib/Owned.sol";
import "./lib/SafeMath.sol";
import "./SHP.sol";
import "./Crowdsale.sol";

contract FoundersWallet is Owned {

    using SafeMath for uint256;

    SHP public shp;
    Crowdsale public crowdsale;
    uint256 collectedTokens;

    /// @notice This returns any Ether sent to the address
    function () {
        require(false);
    }

    /// @notice Creates a new ReserveWallet contract
    function FoundersWallet(address _shp, Crowdsale _crowdsale) {
        shp = SHP(_shp);
        crowdsale = Crowdsale(_crowdsale);
    }

    function getExtractableTokens() public onlyOwner returns (uint256) {

        uint256 balance = shp.balanceOf(address(this));
        uint256 total = collectedTokens.add(balance);

        uint256 finalizedTime = crowdsale.finalizedTime();

        require(finalizedTime > 0);

        uint256 canExtract = total.mul(getTime().sub(finalizedTime)).div(months(24));

        return canExtract.sub(collectedTokens);
    }

    function collectTokens(address recipient) public onlyOwner {

        uint256 balance = shp.balanceOf(address(this));
        uint256 canExtract = getExtractableTokens();

        if (canExtract > balance) {
            canExtract = balance;
        }

        collectedTokens = collectedTokens.add(canExtract);
        assert(shp.transfer(recipient, canExtract));

        TokensWithdrawn(recipient, canExtract);
    }

    function months(uint256 m) internal returns (uint256) {
        return m.mul(30 days);
    }

    function getTime() internal returns (uint256) {
        return now;
    }

    event TokensWithdrawn(address indexed _holder, uint256 _amount);
}