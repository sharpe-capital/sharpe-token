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
            gas: 6000000,
            gasPrice: 20e9,
        },
        testnet: {
            network_id: 3,
            host: "34.240.84.166",
            port: 8545,
            gas: 40000000,
            gasPrice: 20e9,
        },
        mainnet: {
            network_id: 1,
            host: "34.240.84.166",
            port: 8545,
            gas: 40000000,
            gasPrice: 20e9,
        },
        coverage: {
            host: "localhost",
            network_id: "23",
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01
        },
    },
    mocha: {
        enableTimeouts: false
    }
};