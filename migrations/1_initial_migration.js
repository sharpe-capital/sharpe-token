var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {
    console.log("DEPLOY", deployer);
    console.log("NETWORK",network);

    web3.personal.unlockAccount(accounts[0], "1234", 0);
    web3.personal.unlockAccount(accounts[1], "1234", 0);

    function checkAllBalances() {
            var totalBal = 0;
        web3.fromWei(web3.eth.getBalance('0xee7de5394d9c64a1fe73fd7b0ef9f8df3c6b4497'),'ether').toString(10)
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