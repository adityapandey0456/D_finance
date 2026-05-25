const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// --- 💳 PAYMENT ROUTES (D-FINANCE BACKEND) ---

/**
 * 1. Create Order
 * Path: /api/payments/create-order
 */
router.post('/create-order', protect, paymentController.createOrder);

/**
 * 2. Verify Payment (Manual Verification Backup)
 * Path: /api/payments/verify
 */
router.post('/verify', protect, paymentController.verifyAndSavePayment);

/**
 * 3. 🔥 WEBHOOK (Automation Heart)
 * Path: /api/payments/webhook
 * 🚨 CRITICAL: 'protect' middleware hata diya hai taaki 401 error na aaye!
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * 4. NEW: Manual Payment Receipt Submission
 * Path: /api/payments/pay-manual/:loanId
 */
router.post('/pay-manual/:loanId', protect, paymentController.payManual);

module.exports = router;