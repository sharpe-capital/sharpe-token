const TradeLedgerClient = require('./TradeLedgerClient');
const tradeLedgerClient = new TradeLedgerClient('0x9823e8702a59726b72cda26bfefbb6a228a679c3');

var testLedger = async function() {
    
    let result = await tradeLedgerClient.countAccounts();
    console.log(result);
    
    result = await tradeLedgerClient.addAccount('12345', 10000);
    console.log(result);
    
    result = await tradeLedgerClient.countAccounts();
    console.log(result);

    result = await tradeLedgerClient.getAccount('12345');
    console.log(result);

    // Add position
    // Get position
    // Update position (x30 days)
    // Close position
    // Get position
    // Get equity points
    // Get account (not required??)
};

testLedger();

// tradeLedgerClient.countAccounts().then(result => console.log(result));
// tradeLedgerClient.addAccount("12345", 10000).then(result => console.log(result));