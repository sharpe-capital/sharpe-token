var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {
    console.log("DEPLOY", deployer);
    console.log("NETWORK",network);

    web3.personal.unlockAccount("0x167b7133b1caa3ce98a911df67c3f760889a37be", "", 0);

    function checkAllBalances() {
            var totalBal = 0;
        web3.fromWei(web3.eth.getBalance('0x167b7133b1caa3ce98a911df67c3f760889a37be'),'ether').toString(10)
        for (var acctNum in accounts) {
            var acct = accounts[acctNum];
            var acctBal = web3.fromWei(web3.eth.getBalance(acct), "ether");
            totalBal += parseFloat(acctBal);
            console.log("  eth.accounts[" + acctNum + "]: \t" + acct + " \tbalance: " + acctBal + " ether");
        }
        
        console.log("Latest Block " + web3.eth.getBlock("latest").number);
    };
    checkAllBalances();
    //console.log("ACCOUNTS", m);
    deployer.deploy(Migrations);
};