import "./lib/Owned.sol";
import "./lib/SafeMath.sol";
import "./SHP.sol";
import "./SharpeContribution.sol";

pragma solidity ^0.4.11;

contract FoundersWallet is Owned {

    using SafeMath for uint256;

    SHP public shp;
    SharpeContribution public contribution;

    /// @notice This returns any Ether sent to the address
    function () {
        throw;
    }

    /// @notice Creates a new ReserveWallet contract
    function FoundersWallet(address _shp, SharpeContribution _contribution) {
        shp = SHP(_shp);
        contribution = SharpeContribution(_contribution);
    }

    function transfer(uint256 amount, address toAddress) {

        // TODO - do we want to prevent transfers to contracts? Seems sensible since tokens could get 'stuck'
        
        uint256 balance = shp.balanceOf(address(this));
        uint256 totalMinted = shp.mintedAt(address(this));
        uint256 finalizedTime = contribution.finalizedTime();

        require(finalizedTime > 0 && getTime() > finalizedTime.add(months(6)));

        bool vestingPeriod1 = getTime() > finalizedTime.add(months(6)) && getTime() <= finalizedTime.add(months(12));
        bool vestingPeriod2 = getTime() > finalizedTime.add(months(12)) && getTime() <= finalizedTime.add(months(24));
        bool vestingOver = getTime() > finalizedTime.add(months(24));

        require(vestingPeriod1 || vestingPeriod2 || vestingOver);

        uint256 multiplier = 1;
        if(vestingPeriod1) {
            multiplier = 25;
        } else if (vestingPeriod2) {
            multiplier = 75;
        }

        uint256 totalPermitted = totalMinted.mul(percent(multiplier)).div(percent(100));
        uint256 totalSpent = totalMinted.sub(balance);
        uint256 permitted = totalPermitted.sub(totalSpent);

        require(amount <= permitted);
        require(shp.transfer(toAddress, amount));
    }

    function percent(uint256 p) internal returns (uint256) {
        return p.mul(10**16);
    }

    function months(uint256 m) internal returns (uint256) {
        return m.mul(30 days);
    }

    function getTime() internal returns (uint256) {
        return now;
    }
}