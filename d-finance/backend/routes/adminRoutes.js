const express = require('express');
const router = express.Router();

// 1. Models Import
const User = require('../models/User');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment'); 

// 2. Middleware & Controller Import
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const loanController = require('../controllers/loanController'); 
const cashfreeController = require('../controllers/cashfreeController'); // 🔥 Link this

// --- 📊 DASHBOARD STATS ---
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const loans = await Loan.find();
        const customerCount = await User.countDocuments({ role: 'user' });
        const totalDisbursed = loans.reduce((acc, curr) => acc + (curr.amount || 0), 0);

        let totalRecovered = 0;
        loans.forEach(loan => {
            loan.repaymentHistory?.forEach(pay => {
                if (pay.status === 'Approved' || pay.status === 'Success') {
                    totalRecovered += (pay.amount || 0);
                }
            });
        });

        res.json({ totalDisbursed, totalRecovered, customerCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 💰 PAYMENT VERIFICATION ---
router.get('/pending-payments', verifyToken, isAdmin, async (req, res) => {
    try {
        const payments = await Payment.find({ status: 'Pending' }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/approve-payment/:id', verifyToken, isAdmin, loanController.approvePayment);
router.delete('/reject-payment/:id', verifyToken, isAdmin, loanController.rejectPayment);

// --- 🔥 CASHFREE PAYMENT INTEGRATION ROUTE ---
router.post('/cashfree/create-emi-order', verifyToken, cashfreeController.createEmiPaymentOrder);

// --- 👥 USER & STAFF MANAGEMENT ---
router.get('/all-customers', verifyToken, isAdmin, async (req, res) => {
    try {
        const customers = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/all-staff', verifyToken, isAdmin, async (req, res) => {
    try {
        const staff = await User.find({ role: { $ne: 'user' } }).select('-password').sort({ role: 1 });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route for "All Loans" required for DailyCollectionReport
router.get('/all-loans', verifyToken, isAdmin, async (req, res) => {
    try {
        const loans = await Loan.find().sort({ createdAt: -1 });
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/collection-report', verifyToken, isAdmin, async (req, res) => {
    try {
        const today = new Date().setHours(0, 0, 0, 0);
        const loans = await Loan.find();
        let report = [];
        loans.forEach(loan => {
            loan.repaymentHistory?.forEach(pay => {
                const payDate = new Date(pay.date || pay.paymentDate).setHours(0, 0, 0, 0);
                if (payDate === today && (pay.status === 'Approved' || pay.status === 'Success')) {
                    report.push({
                        ...pay.toObject ? pay.toObject() : pay,
                        loanId: loan.loanId,
                        customerName: loan.customerName
                    });
                }
            });
        });
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "User removed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;