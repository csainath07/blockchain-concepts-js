const SHA256 = require("crypto-js/sha256");

class BlockChain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.createNewBlock(0, 0, 0);

    this.currentNodeUrl = process.argv[3];
    this.networkNodes = [];
  }

  createNewBlock = (nonce, previousBlockHash, hash) => {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions],
      nonce,
      hash,
      previousBlockHash,
    };

    this.chain.push(newBlock);
    this.pendingTransactions = [];

    return newBlock;
  };

  getLastBlock = () => {
    return this.chain[this.chain.length - 1];
  };

  createNewTransaction = (amount, sender, recipient) => {
    const newTransaction = {
      amount,
      sender,
      recipient,
    };
    this.pendingTransactions.push(newTransaction);
    return this.getLastBlock()?.["index"] + 1;
  };

  hashBlock = (previousBlockHash, currentBlockData, nonce) => {
    const dataString = `${previousBlockHash}${nonce.toString()}${JSON.stringify(
      currentBlockData
    )}`;
    return SHA256(dataString).toString();
  };

  proofOfWork = (previousBlockHash, currentBlockData) => {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== "0000") {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
  };
}

module.exports = {
  BlockChain,
};
