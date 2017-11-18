pragma solidity 0.4.15;

/*    
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

 
import "./lib/MiniMeToken.sol";


contract SHP is MiniMeToken {
    // @dev SHP constructor
    function SHP(address _tokenFactory)
            MiniMeToken(
                _tokenFactory,
                0x0,                             // no parent token
                0,                               // no snapshot block number from parent
                "Sharpe Platform Token",         // Token name
                18,                              // Decimals
                "SHP",                           // Symbol
                true                             // Enable transfers
            ) {}
}