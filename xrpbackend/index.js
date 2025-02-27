// index.js - Main Backend Server File
const express = require("express");
const xrplRoutes = require("./routes");
const dotenv = require("dotenv");
const cors = require("cors");
const { connectXRPL } = require("./xrplService");

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to XRPL
connectXRPL();

// Use API Routes
app.use("/api", xrplRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
