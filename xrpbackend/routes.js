// routes.js - API Routes File
const express = require("express");
const { createToken, stakeTokens, contributeLiquidity, voteOnProposal } = require("./xrplService");
const router = express.Router();

router.post("/create-token", createToken);
router.post("/stake", stakeTokens);
router.post("/liquidity", contributeLiquidity);
router.post("/vote", voteOnProposal);

module.exports = router;
