module.exports = {
    testCommand: 'truffle test test/endToEndSale.js --network coverage',
    copyNodeModules: true,
    skipFiles: [
        'lib/MultiSigWallet.sol',
        'lib/MiniMeToken.sol',
        'lib/Owned.sol',
        'lib/SafeMath.sol',
        'lib/StandardToken.sol',
        'lib/Token.sol',
        'lib/Trustee.sol'
    ]
}