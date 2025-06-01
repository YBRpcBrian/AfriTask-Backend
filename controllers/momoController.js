const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.MOMO_API_KEY;
const BASE_URL = "https://api.pay.mynkwa.com";

// Utility: Make API request
const makeApiRequest = async (url, method, data) => {
  try {
    console.log(`[API REQUEST] ${method} ${url}`, data || "");
    const response = await axios({
      url: `${BASE_URL}${url}`,
      method,
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      data,
    });
    console.log(`[API RESPONSE] ${method} ${url}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API ERROR] ${method} ${url}`, error.response?.data || error.message);
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
  }
};

// Utility: Delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Controller: Deposit from user (Collect)
const depositController = async (req, res) => {
  const { number, amount } = req.body;
  console.log(`[DEPOSIT INITIATED] Number: ${number}, Amount: ${amount}`);

  try {
    // Step 1: Initiate Collection
    const collectResponse = await makeApiRequest("/collect", "POST", {
      phoneNumber: number,
      amount,
    });

    if (!collectResponse.id) {
      return res.status(400).json({ error: "Failed to initiate deposit" });
    }

    // Step 2: Poll Collection Status
    let statusResponse;
    let attempts = 0;
    do {
      statusResponse = await makeApiRequest(`/payments/${collectResponse.id}`, "GET");
      console.log(`[COLLECTION STATUS] Attempt ${attempts + 1}:`, statusResponse.status);
      if (statusResponse.status === "success") break;
      attempts++;
      await delay(5000);
    } while (statusResponse.status !== "success" && attempts < 100);

    if (statusResponse.status !== "success") {
      return res.status(400).json({ error: "Deposit failed after multiple attempts" });
    }

    res.status(200).json({ message: "Deposit successful", reference: collectResponse.id });
  } catch (error) {
    console.error("[DEPOSIT ERROR]", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller: Disburse to user (Send)
const disburseController = async (req, res) => {
  const { number, amount } = req.body;
  console.log(`[DISBURSE INITIATED] Number: ${number}, Amount: ${amount}`);

  try {
    // Step 1: Initiate Disbursement
    const disburseResponse = await makeApiRequest("/disburse", "POST", {
      phoneNumber: number,
      amount,
    });

    if (!disburseResponse.id) {
      return res.status(400).json({ error: "Failed to initiate disbursement" });
    }

    // Step 2: Poll Disburse Status
    let statusResponse;
    let attempts = 0;
    do {
      statusResponse = await makeApiRequest(`/payments/${disburseResponse.id}`, "GET");
      console.log(`[DISBURSE STATUS] Attempt ${attempts + 1}:`, statusResponse.status);
      if (statusResponse.status === "success") break;
      attempts++;
      await delay(5000);
    } while (statusResponse.status !== "success" && attempts < 100);

    if (statusResponse.status !== "success") {
      return res.status(400).json({ error: "Disbursement failed after multiple attempts" });
    }

    res.status(200).json({ message: "Disbursement successful", reference: disburseResponse.id });
  } catch (error) {
    console.error("[DISBURSE ERROR]", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  depositController,
  disburseController,
};
