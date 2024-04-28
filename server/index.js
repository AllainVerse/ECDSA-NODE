const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");

app.use(cors());
app.use(express.json());

// public keys
const balances = {
  "031b0b1b350aed5a3bb44af48e3750bdb9a218ebf8dcef99ceb8df27f449aac50b": 200,
  "023a5a80a416343fcfd0ce22dfc6a632fcb1fe686679728464c18dffcc732603aa": 50,
  "0319ca9aed054faf671392bbf4b5ce98ecc152316ec39b0286654157d0c2239cbe": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, sig: sigStringed, msg } = req.body;
  const { recipient, amount } = msg;

  // convert stringified bigints back to bigints
  const sig = {
    ...sigStringed,
    r: BigInt(sigStringed.r),
    s: BigInt(sigStringed.s),
  };

  const hashMessage = (message) => keccak256(Uint8Array.from(message));

  const isValid = secp.secp256k1.verify(sig, hashMessage(msg), sender) === true;

  if (!isValid) res.status(400).send({ message: "Bad signature!" });

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
