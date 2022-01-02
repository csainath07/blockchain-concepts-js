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
