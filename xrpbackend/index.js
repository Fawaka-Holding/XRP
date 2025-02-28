// index.js - Main Backend Server File
const express = require("express");
const xrplRoutes = require("./routes");
const dotenv = require("dotenv");
const cors = require("cors");
const { connectXRPL } = require("./xrplService");
const { proposeETFChange, requestAdminOverride, applyAdminOverride, governanceVote } = require("./GovernanceEtfContract");
const { handleDeposit, handleWithdrawal } = require("./etfContract");

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to XRPL
connectXRPL();

// Use API Routes
app.use("/api", xrplRoutes);

// Governance ETF Routes
app.post("/api/etf/propose-change", async (req, res) => {
  try {
    const { userSeed, etfId, newAllocation } = req.body;
    const response = await proposeETFChange(userSeed, etfId, newAllocation);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/etf/admin-override", async (req, res) => {
  try {
    const { adminSeed, etfId, globalOverride } = req.body;
    const response = await requestAdminOverride(adminSeed, etfId, globalOverride);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/etf/apply-override", async (req, res) => {
  try {
    const { adminSeed, etfId, globalOverride } = req.body;
    const response = await applyAdminOverride(adminSeed, etfId, globalOverride);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/governance/vote", async (req, res) => {
  try {
    const { voterSeed, etfId, newAllocation } = req.body;
    const response = await governanceVote(etfId, newAllocation, voterSeed);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ETF Deposit & Withdrawal Routes
app.post("/api/etf/deposit", async (req, res) => {
  try {
    const { userSeed, amount } = req.body;
    const netAmount = await handleDeposit(userSeed, amount);
    res.json({ success: true, netAmount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/etf/withdraw", async (req, res) => {
  try {
    const { userSeed, amount } = req.body;
    const netAmount = await handleWithdrawal(userSeed, amount);
    res.json({ success: true, netAmount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
