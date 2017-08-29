pragma solidity ^0.4.11;

import "./lib/SafeMath.sol";
import "./SHP.sol";
import "./Crowdsale.sol";
import "./lib/Owned.sol";

contract ReserveWallet is Owned {

    using SafeMath for uint256;

    SHP public shp;
    Crowdsale public crowdsale;

    /// @notice This returns any Ether sent to the address
    function () {
        require(false);
    }

    /// @notice Creates a new ReserveWallet contract
    function ReserveWallet(address _shp, Crowdsale _crowdsale) {
        shp = SHP(_shp);
        crowdsale = Crowdsale(_crowdsale);
    }

    function transfer(address toAddress, uint256 amount) {
        // TODO - do we want to prevent transfers to contracts? Seems sensible since tokens could get 'stuck'
        uint256 finalizedTime = crowdsale.finalizedTime();
        require(finalizedTime > 0 && getTime() > finalizedTime.add(months(12)));
        require(shp.transfer(toAddress, amount));
    }

    function months(uint256 m) internal returns (uint256) {
        return m.mul(30 days);
    }

    function getTime() internal returns (uint256) {
        return now;
    }
}