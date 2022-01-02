const express = require("express");
const { BlockChain } = require("./blockchain");
const { v1: uuidV1 } = require("uuid");

const app = express();
const ParasCoin = new BlockChain();
const nodeAddress = uuidV1().split("-").join("");

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.get("/blockchain", (req, res) => {
  res.json(ParasCoin);
});

app.post("/transaction", (req, res) => {
  const { amount, sender, recipient } = req.body;
  const blockIndex = ParasCoin.createNewTransaction(amount, sender, recipient);
  res.json({
    node: `Transaction will be added in block ${blockIndex}.`,
  });
});

app.get("/mine", (req, res) => {
  const previousBlock = ParasCoin.getLastBlock();
  const previousBlockHash = previousBlock["hash"];
  const currentBlockData = {
    index: previousBlock["index"] + 1,
    transactions: ParasCoin.pendingTransactions,
  };
  const nonce = ParasCoin.proofOfWork(previousBlockHash, currentBlockData);
  const currentBlockHash = ParasCoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );

  //Reward
  ParasCoin.createNewTransaction(12.5, "00", nodeAddress);

  const newBlock = ParasCoin.createNewBlock(
    nonce,
    previousBlockHash,
    currentBlockHash
  );

  res.json({
    note: "New block mined successfully",
    block: newBlock,
  });
});

// listener
app.listen(8000, () => console.log(`Listening on port 8000`));
