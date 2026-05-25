const express = require('express');
const router = express.Router();
const cashfreeController = require('../controllers/cashfreeController');
const loanController = require('../controllers/loanController'); // Aapka existing loan controller

// 1. Existing Loan Routes
router.get('/all-loans', loanController.getAllLoans);
router.post('/create-loan', loanController.createLoan);

// 2. Integrated Cashfree EMI Payment Route
// Is route ko call karte waqt loanId req.body mein bhejna zaroori hoga
router.post('/cashfree/create-emi-order', cashfreeController.createEmiPaymentOrder);

// 3. Optional: Webhook (Agar Cashfree se payment status update lena hai)
router.post('/cashfree/webhook', cashfreeController.handleWebhook);

module.exports = router;