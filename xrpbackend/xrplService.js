// xrplService.js - XRPL Functions File
const xrpl = require("xrpl");
require("dotenv").config();

let client;

async function connectXRPL() {
  client = new xrpl.Client(process.env.XRPL_NODE);
  await client.connect();
  console.log("Connected to XRPL");
}

async function createToken(req, res) {
  const { issuerSeed, tokenName, tokenSymbol, totalSupply } = req.body;
  try {
    const wallet = xrpl.Wallet.fromSeed(issuerSeed);
    const transaction = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Amount: {
        currency: tokenSymbol,
        issuer: wallet.classicAddress,
        value: totalSupply.toString(),
      },
    };

    const prepared = await client.autofill(transaction);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function stakeTokens(req, res) {
  const { stakerSeed, amount, tokenSymbol } = req.body;
  try {
    const wallet = xrpl.Wallet.fromSeed(stakerSeed);
    const transaction = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Amount: {
        currency: tokenSymbol,
        issuer: wallet.classicAddress,
        value: amount.toString(),
      },
      Destination: process.env.STAKING_POOL_ADDRESS,
    };
    
    const prepared = await client.autofill(transaction);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function contributeLiquidity(req, res) {
  const { providerSeed, tokenSymbol, amount } = req.body;
  try {
    const wallet = xrpl.Wallet.fromSeed(providerSeed);
    const transaction = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Amount: {
        currency: tokenSymbol,
        issuer: wallet.classicAddress,
        value: amount.toString(),
      },
      Destination: process.env.LIQUIDITY_POOL_ADDRESS,
    };
    
    const prepared = await client.autofill(transaction);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function voteOnProposal(req, res) {
  const { voterSeed, proposalId, vote } = req.body;
  try {
    const wallet = xrpl.Wallet.fromSeed(voterSeed);
    const transaction = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Amount: vote === "yes" ? "1" : "0", 
      Destination: process.env.GOVERNANCE_WALLET_ADDRESS,
      Memos: [{ Memo: { MemoData: Buffer.from(proposalId).toString("hex") } }],
    };
    
    const prepared = await client.autofill(transaction);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { connectXRPL, createToken, stakeTokens, contributeLiquidity, voteOnProposal };
