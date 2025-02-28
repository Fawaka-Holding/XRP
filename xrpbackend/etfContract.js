const xrpl = require("xrpl");
require("dotenv").config();

const FEE_DISTRIBUTION = {
  deposit: {
    liquidityPool: 0.30, // 30%
    development: 0.30,  // 30%
    governance: 0.20,   // 20%
    buybacks: 0.20      // 20%
  },
  withdrawal: {
    liquidityPool: 0.40, // 40%
    governance: 0.30,   // 30%
    development: 0.20,  // 20%
    buybacks: 0.10      // 10%
  }
};

async function distributeFees(amount, type) {
  const wallet = xrpl.Wallet.fromSeed(process.env.GOVERNANCE_WALLET_SEED);
  const client = new xrpl.Client(process.env.XRPL_NODE);
  await client.connect();

  const allocations = FEE_DISTRIBUTION[type];
  const transactions = [];

  for (const [category, percentage] of Object.entries(allocations)) {
    const allocatedAmount = (amount * percentage).toFixed(6);
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
  console.log("Fees distributed successfully");
}

async function handleDeposit(userSeed, amount) {
  const depositFee = amount * 0.005; // 0.5% Fee
  const netAmount = amount - depositFee;
  await distributeFees(depositFee, "deposit");
  return netAmount;
}

async function handleWithdrawal(userSeed, amount) {
  const withdrawalFee = amount * 0.01; // 1% Fee
  const netAmount = amount - withdrawalFee;
  await distributeFees(withdrawalFee, "withdrawal");
  return netAmount;
}

module.exports = { handleDeposit, handleWithdrawal };
