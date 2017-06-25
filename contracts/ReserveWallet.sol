import "./lib/Owned.sol";
import "./lib/SafeMath.sol";
import "./SHP.sol";
import "./SharpeContribution.sol";

pragma solidity ^0.4.11;

contract ReserveWallet is Owned {

    using SafeMath for uint256;

    SHP public shp;
    SharpeContribution public contribution;

    /// @notice This returns any Ether sent to the address
    function () {
        throw;
    }

    /// @notice Creates a new ReserveWallet contract
    function ReserveWallet(address _shp, SharpeContribution _contribution) {
        shp = SHP(_shp);
        contribution = SharpeContribution(_contribution);
    }

    function transfer(uint256 amount, address toAddress) {
        // TODO - do we want to prevent transfers to contracts? Seems sensible since tokens could get 'stuck'
        uint256 finalizedTime = contribution.finalizedTime();
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