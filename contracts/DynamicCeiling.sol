pragma solidity 0.4.17;

/*
    This Contract has been adopted, with slight modifications, from the 
    Status Netowrd Token written by Jordi Baylina.
    https://github.com/status-im/status-network-token/blob/master/contracts/DynamicCeiling.sol
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import "./lib/SafeMath.sol";
import "./lib/Owned.sol";


contract DynamicCeiling is Owned {
    using SafeMath for uint256;

    struct Ceiling {
        bytes32 hash;
        uint256 limit;
        uint256 slopeFactor;
        uint256 collectMinimum;
    }

    address public saleAddress;

    Ceiling[] public ceilings;
    
    uint256 public currentIndex;
    uint256 public revealedCeilings;
    bool public allRevealed;

    modifier onlySaleAddress {
        require(msg.sender == saleAddress);
        _;
    }

    function DynamicCeiling(address _owner, address _saleAddress) {
        owner = _owner;
        saleAddress = _saleAddress;
    }

    /// @notice This should be called by the creator of the contract to commit
    ///  all the ceilings.
    /// @param _ceilingHashes Array of hashes of each ceiling. Each hash is calculated
    ///  by the `calculateHash` method. More hashes than actual ceilings can be
    ///  committed in order to hide also the number of ceilings.
    ///  The remaining hashes can be just random numbers.
    function setHiddenCeilings(bytes32[] _ceilingHashes) public onlyOwner {
        require(ceilings.length == 0);

        ceilings.length = _ceilingHashes.length;
        for (uint256 i = 0; i < _ceilingHashes.length; i = i.add(1)) {
            ceilings[i].hash = _ceilingHashes[i];
        }
    }

    /// @notice Anybody can reveal the next ceiling if he knows it.
    /// @param _limit Ceiling cap.
    ///  (must be greater or equal to the previous one).
    /// @param _last `true` if it's the last ceiling.
    /// @param _salt Random number used to commit the ceiling
    function revealCeiling(
        uint256 _limit, 
        uint256 _slopeFactor, 
        uint256 _collectMinimum,
        bool _last, 
        bytes32 _salt) 
        public 
        {
        require(!allRevealed);
        require(
            ceilings[revealedCeilings].hash == 
            calculateHash(
                _limit, 
                _slopeFactor, 
                _collectMinimum, 
                _last, 
                _salt
            )
        );

        require(_limit != 0 && _slopeFactor != 0 && _collectMinimum != 0);
        if (revealedCeilings > 0) {
            require(_limit >= ceilings[revealedCeilings.sub(1)].limit);
        }

        ceilings[revealedCeilings].limit = _limit;
        ceilings[revealedCeilings].slopeFactor = _slopeFactor;
        ceilings[revealedCeilings].collectMinimum = _collectMinimum;
        revealedCeilings = revealedCeilings.add(1);

        if (_last) {
            allRevealed = true;
        }
    }

    /// @notice Reveal multiple ceilings at once
    function revealMulti(
        uint256[] _limits,
        uint256[] _slopeFactors,
        uint256[] _collectMinimums,
        bool[] _lasts, 
        bytes32[] _salts) 
        public 
        {
        // Do not allow none and needs to be same length for all parameters
        require(
            _limits.length != 0 &&
            _limits.length == _slopeFactors.length &&
            _limits.length == _collectMinimums.length &&
            _limits.length == _lasts.length &&
            _limits.length == _salts.length
        );

        for (uint256 i = 0; i < _limits.length; i = i.add(1)) {
            
            revealCeiling(
                _limits[i],
                _slopeFactors[i],
                _collectMinimums[i],
                _lasts[i],
                _salts[i]
            );
        }
    }

    /// @notice Move to ceiling, used as a failsafe
    function moveToNextCeiling() public onlyOwner {

        currentIndex = currentIndex.add(1);
    }

    /// @return Return the funds to collect for the current point on the ceiling
    ///  (or 0 if no ceilings revealed yet)
    function availableAmountToCollect(uint256  totallCollected) public onlySaleAddress returns (uint256) {
    
        if (revealedCeilings == 0) {
            return 0;
        }

        if (totallCollected >= ceilings[currentIndex].limit) {  
            uint256 nextIndex = currentIndex.add(1);

            if (nextIndex >= revealedCeilings) {
                return 0; 
            }
            currentIndex = nextIndex;
            if (totallCollected >= ceilings[currentIndex].limit) {
                return 0;  
            }
        }        
        uint256 remainedFromCurrentCeiling = ceilings[currentIndex].limit.sub(totallCollected);
        uint256 reminderWithSlopeFactor = remainedFromCurrentCeiling.div(ceilings[currentIndex].slopeFactor);

        if (reminderWithSlopeFactor > ceilings[currentIndex].collectMinimum) {
            return reminderWithSlopeFactor;
        }
        
        if (remainedFromCurrentCeiling > ceilings[currentIndex].collectMinimum) {
            return ceilings[currentIndex].collectMinimum;
        } else {
            return remainedFromCurrentCeiling;
        }
    }

    /// @notice Calculates the hash of a ceiling.
    /// @param _limit Ceiling cap.
    /// @param _last `true` if it's the last ceiling.
    /// @param _collectMinimum the minimum amount to collect
    /// @param _salt Random number that will be needed to reveal this ceiling.
    /// @return The calculated hash of this ceiling to be used in the `setHiddenCurves` method
    function calculateHash(
        uint256 _limit, 
        uint256 _slopeFactor, 
        uint256 _collectMinimum,
        bool _last, 
        bytes32 _salt) 
        public 
        constant 
        returns (bytes32) 
        {
        return keccak256(
            _limit,
            _slopeFactor, 
            _collectMinimum,
            _last,
            _salt
        );
    }

    /// @return Return the total number of ceilings committed
    ///  (can be larger than the number of actual ceilings on the ceiling to hide
    ///  the real number of ceilings)
    function nCeilings() public constant returns (uint256) {
        return ceilings.length;
    }

}