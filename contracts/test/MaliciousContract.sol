pragma solidity 0.4.18;


contract MaliciousContract {

    address public malliciousAddress;

    function MaliciousContract(address _address) {
        malliciousAddress = _address;
    }

    function() payable {
        malliciousAddress.transfer(msg.value);
    }
}