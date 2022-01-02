const SHA256 = require("crypto-js/sha256");
const { v1: uuidV1 } = require("uuid");

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
    return {
      transactionId: uuidV1().split("-").join(""),
      amount,
      sender,
      recipient,
    };
  };

  addTransactionToPendingTransactions = (transaction) => {
    this.pendingTransactions.push(transaction);
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

  chainIsValid = (blockchain) => {
    let validChain = true;
    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const prevBlock = blockchain[i - 1];

      const blockHash = this.hashBlock(
        prevBlock["hash"],
        {
          transactions: currentBlock["transactions"],
          index: currentBlock["index"],
        },
        currentBlock.nonce
      );

      const validBlockHash = blockHash.substring(0, 4) === "0000";
      if (
        currentBlock["previousBlockHash"] !== prevBlock["hash"] ||
        !validBlockHash
      ) {
        validChain = false;
        break;
      }
    }

    const genesisBlock = blockchain[0];
    if (
      genesisBlock.nonce !== 0 ||
      genesisBlock["hash"] !== 0 ||
      genesisBlock["previousBlockHash"] !== 0 ||
      genesisBlock["transactions"].length !== 0
    ) {
      validChain = false;
    }

    return validChain;
  };
}

module.exports = {
  BlockChain,
};
