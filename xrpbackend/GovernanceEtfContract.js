const xrpl = require("xrpl");
require("dotenv").config();

const COOLDOWN_PERIOD = 60 * 24 * 60 * 60 * 1000; // 60 Days in milliseconds
const OVERRIDE_DELAY = 6 * 60 * 60 * 1000; // 6 Hours in milliseconds
const VOTE_FEE = 1; // $1 in XRP per vote

let etfCooldowns = {}; // Stores cooldown timestamps per ETF
let pendingOverrides = {}; // Stores pending override requests
let voteRecords = {}; // Tracks votes per wallet

const FEE_DISTRIBUTION = {
  governance: {
    liquidityPool: 0.40, // 40%
    governance: 0.30,   // 30%
    development: 0.20,  // 20%
    buybacks: 0.10      // 10%
  }
};

async function proposeETFChange(userSeed, etfId, newAllocation) {
  const now = Date.now();
  if (etfCooldowns[etfId] && now < etfCooldowns[etfId]) {
    throw new Error("ETF is in cooldown period. New proposals are blocked.");
  }

  const approval = await governanceVote(etfId, newAllocation);
  if (approval >= 62) {
    etfCooldowns[etfId] = now + COOLDOWN_PERIOD;
    return { success: true, message: "ETF change approved and applied. Cooldown started." };
  } else {
    return { success: false, message: "Proposal did not reach 62% approval." };
  }
}

async function requestAdminOverride(adminSeed, etfId, globalOverride = false) {
  const wallet = xrpl.Wallet.fromSeed(adminSeed);
  if (!isAuthorizedAdmin(wallet.classicAddress)) {
    throw new Error("Unauthorized admin.");
  }

  pendingOverrides[etfId] = Date.now() + OVERRIDE_DELAY;
  return { success: true, message: `Override request accepted. It will take effect in 6 hours.` };
}

async function applyAdminOverride(adminSeed, etfId, globalOverride = false) {
  const wallet = xrpl.Wallet.fromSeed(adminSeed);
  if (!isAuthorizedAdmin(wallet.classicAddress)) {
    throw new Error("Unauthorized admin.");
  }

  const now = Date.now();
  if (!pendingOverrides[etfId] || now < pendingOverrides[etfId]) {
    throw new Error("Override delay not reached yet.");
  }

  if (globalOverride) {
    etfCooldowns = {}; // Clears cooldowns for all ETFs
  } else {
    delete etfCooldowns[etfId]; // Removes cooldown for specific ETF
  }
  delete pendingOverrides[etfId];

  return { success: true, message: `Admin override applied. ${globalOverride ? "All ETFs" : "ETF " + etfId + ""} unlocked for new proposals.` };
}

async function governanceVote(etfId, newAllocation, voterSeed) {
  const wallet = xrpl.Wallet.fromSeed(voterSeed);
  const voterAddress = wallet.classicAddress;
  
  if (!voteRecords[voterAddress]) {
    voteRecords[voterAddress] = 0;
  }

  const tokenBalance = await getGovernanceTokenBalance(voterAddress);
  if (voteRecords[voterAddress] >= tokenBalance) {
    throw new Error("You can only vote once per governance token you hold.");
  }

  await processVoteFee(voterSeed);
  voteRecords[voterAddress] += 1;
  return Math.random() * 100; // Simulates voting percentage
}

async function processVoteFee(voterSeed) {
  const wallet = xrpl.Wallet.fromSeed(voterSeed);
  const client = new xrpl.Client(process.env.XRPL_NODE);
  await client.connect();

  const voteFeeAmount = VOTE_FEE;
  const transactions = [];

  for (const [category, percentage] of Object.entries(FEE_DISTRIBUTION.governance)) {
    const allocatedAmount = (voteFeeAmount * percentage).toFixed(6);
    const destination = process.env[`${category.toUpperCase()}_ADDRESS`];

    transactions.push({
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Destination: destination,
      Amount: xrpl.xrpToDrops(allocatedAmount),
    });
  }

  for (const tx of transactions) {
    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    await client.submitAndWait(signed.tx_blob);
  }

  await client.disconnect();
  console.log("Vote fee distributed successfully");
}

async function getGovernanceTokenBalance(address) {
  // Placeholder function - Replace with actual XRPL governance token check
  return Math.floor(Math.random() * 10) + 1; // Simulates a balance between 1 and 10
}

function isAuthorizedAdmin(address) {
  return process.env.ADMIN_ADDRESSES.split(",").includes(address);
}

module.exports = { proposeETFChange, requestAdminOverride, applyAdminOverride, governanceVote };
