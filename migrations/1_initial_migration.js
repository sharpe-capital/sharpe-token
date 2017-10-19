var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {
    console.log("DEPLOY", deployer);
    console.log("NETWORK",network);

    web3.personal.unlockAccount("0x57a2925eee743a6f29997e65ea2948f296e84b08", "", 0);

    function checkAllBalances() {
            var totalBal = 0;
        web3.fromWei(web3.eth.getBalance('0x57a2925eee743a6f29997e65ea2948f296e84b08'),'ether').toString(10)
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