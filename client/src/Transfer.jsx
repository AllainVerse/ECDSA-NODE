import { useState } from "react";
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";

// private key 48913bda1dd1e857c010ee21a14f469b13aca0a8cdd4480e74b8cc31f8b02c64
// public key: 031b0b1b350aed5a3bb44af48e3750bdb9a218ebf8dcef99ceb8df27f449aac50b

// private key 3ed5ee0f8af2aa929dbc45352e83deb6065ce6e1b3a35ff49e3f22e7493545e7
// public key: 023a5a80a416343fcfd0ce22dfc6a632fcb1fe686679728464c18dffcc732603aa

// private key 0700f6cabe3615a81940f971ea0dda05471f1c5cd37a96e16e67890124cd22f2
// public key: 0319ca9aed054faf671392bbf4b5ce98ecc152316ec39b0286654157d0c2239cbe

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  const hashMessage = (message) => keccak256(Uint8Array.from(message));
  const signMessage = (msg) => secp256k1.sign(hashMessage(msg), privateKey);

  async function transfer(evt) {
    evt.preventDefault();

    const msg = { amount: parseInt(sendAmount), recipient };
    const sig = signMessage(msg);

    const stringifyBigInts = (obj) => {
      for (let prop in obj) {
        let value = obj[prop];
        if (typeof value === "bigint") {
          obj[prop] = value.toString();
        } else if (typeof value === "object" && value !== null) {
          obj[prop] = stringifyBigInts(value);
        }
      }
      return obj;
    };

    // stringify bigints before sending to server
    const sigStringed = stringifyBigInts(sig);

    const tx = {
      sig: sigStringed,
      msg,
      sender: address,
    };

    try {
      const {
        data: { balance },
      } = await server.post(`send`, tx);
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
