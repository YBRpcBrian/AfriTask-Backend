const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.MOMO_API_KEY;
const BASE_URL = "https://api.pay.mynkwa.com";

// Utility: Delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility: Validate amount
const isValidAmount = (value) =>
  typeof value === "number" && !isNaN(value) && value > 0;

// Utility: Make API Request with logging
const makeApiRequest = async (url, method, data) => {
  try {
    console.log(`\n=== API REQUEST: ${method} ${BASE_URL}${url} ===`);
    console.log("Headers:", {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    });
    if (data) console.log("Body:", JSON.stringify(data));

    const response = await axios({
      url: `${BASE_URL}${url}`,
      method,
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      data,
    });

    console.log(`=== API RESPONSE: ${method} ${BASE_URL}${url} ===`);
    console.log("Status:", response.status);
    console.log("Data:", response.data);

    return response.data;
  } catch (error) {
    console.error(`\n*** API ERROR: ${method} ${BASE_URL}${url} ***`);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error Message:", error.message);
    }

    throw new Error(
      error.response ? JSON.stringify(error.response.data) : error.message
    );
  }
};

// Controller: Deposit (Collect)
const depositController = async (req, res) => {
  let { number, amount } = req.body;
  console.log(`\n>>> [DEPOSIT INITIATED] Number: ${number}, Amount: ${amount}`);

  amount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!number || !isValidAmount(amount)) {
    console.warn("Invalid number or amount");
    return res.status(400).json({ error: "Valid number and numeric amount are required" });
  }

  try {
    // Step 1: Initiate Collection
    const collectResponse = await makeApiRequest("/collect", "POST", {
      phoneNumber: number,
      amount,
    });

    if (!collectResponse.id) {
      console.error("Missing 'id' in collection response");
      return res.status(400).json({ error: "Failed to initiate deposit" });
    }

    // Step 2: Poll Status
    let statusResponse;
    let attempts = 0;
    do {
      attempts++;
      statusResponse = await makeApiRequest(`/payments/${collectResponse.id}`, "GET");
      console.log(`[COLLECTION STATUS] Attempt ${attempts}:`, statusResponse.status);
      if (statusResponse.status === "success") break;
      await delay(5000);
    } while (statusResponse.status !== "success" && attempts < 100);

    if (statusResponse.status !== "success") {
      console.error("Deposit polling failed after 100 attempts");
      return res.status(400).json({ error: "Deposit failed after multiple attempts" });
    }

    console.log(`>>> [DEPOSIT SUCCESSFUL] Ref: ${collectResponse.id}`);
    res.status(200).json({ message: "Deposit successful", reference: collectResponse.id });
  } catch (error) {
    console.error("[DEPOSIT ERROR]", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// Controller: Disburse (Send)
const disburseController = async (req, res) => {
  let { number, amount } = req.body;
  console.log(`\n>>> [DISBURSE INITIATED] Number: ${number}, Amount: ${amount}`);

  amount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!number || !isValidAmount(amount)) {
    console.warn("Invalid number or amount");
    return res.status(400).json({ error: "Valid number and numeric amount are required" });
  }

  try {
    // Step 1: Initiate Disbursement
    const disburseResponse = await makeApiRequest("/disburse", "POST", {
      phoneNumber: number,
      amount,
    });

    if (!disburseResponse.id) {
      console.error("Missing 'id' in disbursement response");
      return res.status(400).json({ error: "Failed to initiate disbursement" });
    }

    // Step 2: Poll Status
    let statusResponse;
    let attempts = 0;
    do {
      attempts++;
      statusResponse = await makeApiRequest(`/payments/${disburseResponse.id}`, "GET");
      console.log(`[DISBURSE STATUS] Attempt ${attempts}:`, statusResponse.status);
      if (statusResponse.status === "success") break;
      await delay(5000);
    } while (statusResponse.status !== "success" && attempts < 100);

    if (statusResponse.status !== "success") {
      console.error("Disbursement polling failed after 100 attempts");
      return res.status(400).json({ error: "Disbursement failed after multiple attempts" });
    }

    console.log(`>>> [DISBURSE SUCCESSFUL] Ref: ${disburseResponse.id}`);
    res.status(200).json({ message: "Disbursement successful", reference: disburseResponse.id });
  } catch (error) {
    console.error("[DISBURSE ERROR]", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

module.exports = {
  depositController,
  disburseController,
};
