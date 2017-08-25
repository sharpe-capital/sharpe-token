const Web3 = require('web3');
const jsonfile = require('jsonfile');

class TradeLedgerClient {

    constructor(address) {
        this.address = address;
        this.compiled = jsonfile.readFileSync("../build/contracts/TradeLedger.json");
        this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        this.contract = this.web3.eth.contract(this.compiled.abi);
        this.tradeLedger = this.contract.at(address);
    }

    getTxnPayload(data) {
        return {
            to: this.address, 
            from: this.web3.eth.accounts[0],
            data: data,
            value: this.web3.toWei(0), 
            gas: 300000, 
            gasPrice: "20000000000"
        };
    }

    getAccountObject(dataArray) {
        return {
            id: dataArray[0],
            balance: dataArray[1].toNumber(),
            equity: dataArray[2].toNumber(),
            leverage: dataArray[3].toNumber(),
            profitLoss: dataArray[4].toNumber()
        };
    }

    getPositionObject(dataArray) {
        return {
            openPrice: dataArray[0],
            closePrice: dataArray[1],
            size: dataArray[2].toNumber(),
            profitLoss: dataArray[3].toNumber(),
            openDate: dataArray[4],
            closeDate: dataArray[5],
            ticker: dataArray[6]
        };
    }

    getEquityPointObject(dataArray) {
        return {
            date: dataArray[0],
            balance: dataArray[1].toNumber(),
            equity: dataArray[2].toNumber(),
            leverage: dataArray[3].toNumber(),
            profitLoss: dataArray[4].toNumber()
        };
    }

    getPositionKeysObject(dataArray) {
        return {
            privateKey: dataArray[0],
            publicKey: dataArray[1]
        };
    }

    async releaseKeyPair(id, privateKey, publicKey) {
        const data = await this.tradeLedger.releaseKeyPair.getData(id, privateKey, publicKey);
        return await this.web3.eth.sendTransaction(getTxnPayload(data));
    }

    async countAccountPositions(accountId) {
        return await this.tradeLedger.countAccountPositions.call(accountId).toNumber();
    }

    async countAccountEquityPoints(accountId) {
        return await this.tradeLedger.countAccountEquityPoints.call(accountId).toNumber();
    }

    async countAccounts() {
        return await this.tradeLedger.countAccounts.call().toNumber();
    }

    async countPositions() {
        return await this.tradeLedger.countPositions.call().toNumber();
    }

    async countEquityPoints() {
        return await this.tradeLedger.countEquityPoints.call().toNumber();
    }

    async addAccount(id, balance) {
        const data = await this.tradeLedger.addAccount.getData(id, balance);
        return await this.web3.eth.sendTransaction(getTxnPayload(data));
    }

    async getAccount(id) {
        const dataArray = await this.tradeLedger.getAccount.call(id);
        return getAccountObject(dataArray);
    }

    async getPosition(id) {
        const dataArray = await this.tradeLedger.getPosition.call(id);
        return getPositionObject(dataArray);
    }

    async getEquityPoint(id) {
        const dataArray = await this.tradeLedger.getEquityPoint.call(id);
        return getEquityPointObject(dataArray);
    }

    async getPositionKeys(id) {
        const dataArray = await this.tradeLedger.getPositionKeys.call(id);
        return getPositionKeysObject(dataArray);
    }

    async getPositionKeysByIndex(accountId, index) {
        const dataArray = await this.tradeLedger.getPositionKeysByIndex.call(accountId, index);
        return getPositionKeysObject(dataArray);
    }

    async getPositionByIndex(accountId, index) {
        const dataArray = await this.tradeLedger.getPositionByIndex.call(accountId, index);
        return getPositionObject(dataArray);
    }

    async getEquityPointByIndex(accountId, index) {
        const dataArray = await this.tradeLedger.getEquityPointByIndex.call(accountId, index);
        return getEquityPointObject(dataArray);
    }

    async getAccountPositions(accountId) {
        const total = await this.countAccountPositions(accountId);
        const positions = [];
        for(var i=0; i<total; i++) {
            positions.push(await getPositionByIndex(accountId, i));
        }
        return positions;
    }

    async getAccountEquityPoints(accountId) {
        const total = await this.countAccountEquityPoints(accountId);
        const equityPoints = [];
        for(var i=0; i<total; i++) {
            equityPoints.push(await getEquityPointByIndex(accountId, i));
        }
        return equityPoints;
    }

    async addPosition(
        id, 
        openPrice, 
        stopPrice, 
        limitPrice, 
        size, 
        exposure, 
        openDate, 
        ticker, 
        accountId
    ) {
        const data = await this.tradeLedger.addPosition.getData(
            id, 
            openPrice, 
            stopPrice, 
            limitPrice, 
            size, 
            exposure, 
            openDate, 
            ticker, 
            accountId
        );
        return await this.web3.eth.sendTransaction(getTxnPayload(data));
    }

    async closePosition(
        id, 
        closePrice, 
        closeDate, 
        profitLoss,
        currentDateTime
    ) {
        const data = await this.tradeLedger.closePosition.getData(
            id, 
            closePrice, 
            closeDate, 
            profitLoss,
            currentDateTime
        );
        return await this.web3.eth.sendTransaction(getTxnPayload(data));
    }
    
    async updatePosition(id, profitLoss, currentDateTime) {
        const data = await this.tradeLedger.closePosition.getData(
            id, profitLoss, currentDateTime
        );
        return await this.web3.eth.sendTransaction(getTxnPayload(data));
    }
}

module.exports = TradeLedgerClient;