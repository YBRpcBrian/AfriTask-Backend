const axios = require('axios');
require('dotenv').config();

const BTC_API_BASE_URL = process.env.BTC_API_BASE_URL;
const BTC_API_KEY = process.env.BTC_API_KEY;

// Utility: Format ISO date (YYYY-MM-DD)
const formatDate = (date) => date.toISOString().split('T')[0];

// 📦 Create Lightning Invoice helper
const createLightningInvoice = async ({ amount, description, reference }) => {
  try {
    const amountInSats = Math.floor(Number(amount)); // Assuming 1 XAF = 1 SAT
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const payload = {
      amount: amountInSats,
      amountCurrency: 'SATs',
      description,
      reference,
      expiresAt: formatDate(expiresAt),
    };

    console.log('⚡ Creating Lightning Invoice with payload:', JSON.stringify(payload));

    const response = await axios.post(
      `${BTC_API_BASE_URL}/api/v1/invoices`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          'x-api-key': BTC_API_KEY,
        },
      }
    );

    console.log('✅ Lightning Invoice created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error in createLightningInvoice:', error.response?.data || error.message);
    throw error;
  }
};

// 🌐 API Controller: Create Invoice
const createInvoice = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || !description) {
      console.warn('⚠️ Missing required fields amount or description');
      return res.status(400).json({
        message: 'Amount and description are required',
      });
    }

    const reference = `AfriTask-${description}-${Date.now()}`;
    console.log(`📩 Request to create invoice: amount=${amount}, description=${description}, reference=${reference}`);

    const invoice = await createLightningInvoice({ amount, description, reference });

    res.status(201).json({
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error) {
    console.error('❌ Failed to create invoice:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to create invoice',
      error: error.response?.data || error.message,
    });
  }
};

// 🔍 API Controller: Get Invoice Status
const getInvoiceStatus = async (req, res) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    console.warn('⚠️ Missing invoiceId param');
    return res.status(400).json({
      message: 'Invoice ID parameter is required',
    });
  }

  try {
    console.log(`🔍 Fetching invoice status for ID: ${invoiceId}`);

    const config = {
      headers: {
        'x-api-key': BTC_API_KEY,
        Accept: '*/*',
      },
    };

    const response = await axios.get(
      `${BTC_API_BASE_URL}/api/v1/partners/invoices/${invoiceId}`,
      config
    );

    console.log(`✅ Invoice status retrieved:`, response.data);

    res.status(200).json({
      message: 'Invoice status retrieved successfully',
      data: response.data,
    });
  } catch (error) {
    console.error(`❌ Error getting invoice status for ID ${invoiceId}:`, error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to get invoice status',
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  createInvoice,
  getInvoiceStatus,
};
