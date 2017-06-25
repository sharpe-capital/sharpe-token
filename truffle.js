const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic = process.env.TEST_MNEMONIC || 'status mnemonic status mnemonic status mnemonic status mnemonic status mnemonic status mnemonic';
const providerRopsten = new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/', 0);
const providerKovan = new HDWalletProvider(mnemonic, 'https://kovan.infura.io', 0);

module.exports = {
    rpc: {
        host: "localhost",
        port: 8545
    },
    networks: {
        development: {
            network_id: 15,
            host: "localhost",
            port: 8545,
            gas: 4000000,
            gasPrice: 20e9,
        },
        ropsten: {
            network_id: 3,
            host: "localhost",
            port: 8545,
            gas: 4000000,
            gasPrice: 20e9,
        }
    }
};
