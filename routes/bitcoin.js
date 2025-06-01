const express = require('express');
const router = express.Router();
const { createInvoice, getInvoiceStatus } = require('../controllers/lightingController');

// @route   POST /api/bitcoin/create-invoice
// @desc    Create a new Lightning invoice
router.post('/create-invoice', createInvoice);

// @route   GET /api/bitcoin/status/:invoiceId
// @desc    Get the status of an invoice
router.get('/status/:invoiceId', getInvoiceStatus);

module.exports = router;
