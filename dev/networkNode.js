const express = require("express");
const { BlockChain } = require("./blockchain");
const { v1: uuidV1 } = require("uuid");
const axios = require("axios");

const app = express();
const ParasCoin = new BlockChain();
const nodeAddress = uuidV1().split("-").join("");
const PORT = process.argv[2] || 8000;
// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.get("/blockchain", (req, res) => {
  res.json(ParasCoin);
});

app.post("/transaction/broadcast", (req, res) => {
  const { amount, sender, recipient } = req.body;
  const newTransaction = ParasCoin.createNewTransaction(
    amount,
    sender,
    recipient
  );
  ParasCoin.addTransactionToPendingTransactions(newTransaction);

  const broadcastTransactionPromise = ParasCoin.networkNodes.map((networkUrl) =>
    axios.post(`${networkUrl}/transaction`, { newTransaction })
  );

  Promise.all(broadcastTransactionPromise).then((data) => {
    res.json({
      note: `Transaction created and broadcast successfully.`,
    });
  });
});

app.post("/transaction", (req, res) => {
  const { newTransaction } = req.body;
  const blockIndex =
    ParasCoin.addTransactionToPendingTransactions(newTransaction);
  res.json({
    note: `Transaction will be added in block ${blockIndex}.`,
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

  const newBlock = ParasCoin.createNewBlock(
    nonce,
    previousBlockHash,
    currentBlockHash
  );

  //broadcast
  const broadcastBlockPromises = ParasCoin.networkNodes.map((networkNodeUrl) =>
    axios.post(`${networkNodeUrl}/receive-new-block`, { newBlock })
  );

  Promise.all(broadcastBlockPromises)
    .then((data) =>
      axios.post(`${ParasCoin.currentNodeUrl}/transaction/broadcast`, {
        amount: 12.5,
        sender: "00",
        recipient: nodeAddress,
      })
    )
    .then((data) => {
      res.json({
        note: "New block mined and broadcast successfully",
        block: newBlock,
      });
    });
});

app.post("/receive-new-block", (req, res) => {
  const { newBlock } = req.body;
  const lastBlock = ParasCoin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
  if (correctHash && correctIndex) {
    ParasCoin.chain.push(newBlock);
    ParasCoin.pendingTransactions = [];

    res.json({
      note: "New block received and accepted successfully",
      block: newBlock,
    });
  } else {
    res.json({
      note: "New block rejected",
      block: newBlock,
    });
  }
});

/** Distributed Network Nodes Handling */
app.post("/register-and-broadcast-node", (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  if (!ParasCoin.networkNodes.includes(newNodeUrl)) {
    ParasCoin.networkNodes.push(newNodeUrl);
  }

  // broadcast
  const registerNodePromises = ParasCoin.networkNodes.map((networkNodeUrl) => {
    return axios.post(`${networkNodeUrl}/register-node`, {
      newNodeUrl,
    });
  });

  Promise.all(registerNodePromises)
    .then((response) =>
      axios.post(`${newNodeUrl}/register-nodes-bulk`, {
        allNetworkNodes: [...ParasCoin.networkNodes, ParasCoin.currentNodeUrl],
      })
    )
    .then(() =>
      res.json({ note: "New node register to network successfully" })
    );
});

app.post("/register-node", (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  if (
    !ParasCoin.networkNodes.includes(newNodeUrl) &&
    ParasCoin.currentNodeUrl !== newNodeUrl
  ) {
    ParasCoin.networkNodes.push(newNodeUrl);
  }
  res.json({ note: "New node registered successfully with node" });
});

app.post("/register-nodes-bulk", (req, res) => {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    if (
      networkNodeUrl !== ParasCoin.currentNodeUrl &&
      !ParasCoin.networkNodes.includes(networkNodeUrl)
    ) {
      ParasCoin.networkNodes.push(networkNodeUrl);
    }
  });
  res.json({ note: "Bulk nodes registered successfully" });
});
// listener
app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
