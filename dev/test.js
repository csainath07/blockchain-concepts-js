const { BlockChain } = require("./blockchain");

const paras = new BlockChain();

// paras.createNewBlock("123456", "ASDASDASDASDAXCXCV", "AXCXCVXRTYUYU");
// paras.createNewTransaction(100, "FSDFSDFSDFSDFD", "XCVXCVXCVSDFSDF");
// paras.createNewBlock("56789", "AASHDJHADJHASJDHJAS", "ASDJAHSGDHJAGSDJ");

// console.log(paras.chain[1]);

const previousBlockHash = "FSDFSDFSDFXCVXRWER";
const currentBlockData = [
  {
    amount: 100,
    sender: "CVBNCMMNZXKCJZKJKJDF",
    recipient: "AQWENMQWEMNMQWENMQEWN",
  },
  {
    amount: 3100,
    sender: "CVBNCMMNZXKCJZKJKJDF",
    recipient: "AQWENMQWEMNMQWENMQEWN",
  },
  {
    amount: 1100,
    sender: "CVBNCMMNZXKCJZKJKJDF",
    recipient: "AQWENMQWEMNMQWENMQEW",
  },
];

console.log(paras.hashBlock(previousBlockHash, currentBlockData, 13692));
