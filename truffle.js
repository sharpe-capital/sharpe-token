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
        ropsten: {
            network_id: 3,
            host: "localhost",
            port: 8545,
            gas: 4000000,
            gasPrice: 20e9,
        },
        coverage: {
            host: "localhost",
            network_id: "*",
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01
        },
    },
    mocha: {
        enableTimeouts: false
    }
};