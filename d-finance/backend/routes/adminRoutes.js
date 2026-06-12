const express = require("express");
const router = express.Router();

// Models
const User = require("../models/User");
const Loan = require("../models/Loan");
const Payment = require("../models/Payment");

// Middleware
const { verifyToken } = require("../middlewares/authMiddleware");

// Controller
const loanController = require("../controllers/loanController");

// SMART ROLE CHECKER ENGINE
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (req.user && req.user.role) {
      const userRole = req.user.role.toLowerCase().trim();
      const cleanAllowed = allowedRoles.map(r => r.toLowerCase().trim());

      if (cleanAllowed.includes(userRole)) {
        return next();
      }
    }
    return res.status(403).json({ 
      message: `Access denied. Unauthorized role restriction. Detected Role: "${req.user?.role || 'Unknown'}"` 
    });
  };
};

// =====================================
// DASHBOARD STATS
// =====================================
router.get("/stats", verifyToken, allowRoles("admin", "accountant", "officer", "field officer", "fieldofficer", "advisor", "user"), async (req, res) => {
  try {
    const loans = await Loan.find();
    const customerCount = await User.countDocuments({ role: { $in: ["user", "customer", "Customer", "User"] } });

    const totalDisbursed = loans.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    let totalRecovered = 0;

    loans.forEach((loan) => {
      loan.repaymentHistory?.forEach((pay) => {
        if (pay.status === "Approved" || pay.status === "Success") {
          totalRecovered += pay.amount || 0;
        }
      });
    });

    res.json({ totalDisbursed, totalRecovered, customerCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================
// PAYMENT VERIFICATION & QUEUES
// =====================================
router.get("/pending-payments", verifyToken, allowRoles("admin", "accountant"), async (req, res) => {
  try {
    const payments = await Payment.find({ status: "Pending" }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/approve-payment/:id", verifyToken, allowRoles("admin", "accountant"), loanController.approvePayment);
router.delete("/reject-payment/:id", verifyToken, allowRoles("admin", "accountant"), loanController.rejectPayment);

// =====================================
// 🔥 NEW: CUSTOMER SUBMIT PENDING PAYMENT (MANUAL QR PIPELINE)
// =====================================
router.post("/submit-pending-payment", verifyToken, allowRoles("admin", "accountant", "officer", "field officer", "fieldofficer", "advisor", "user", "customer", "Customer"), async (req, res) => {
  try {
    const { loanId, amount, utr, screenshot, remarks } = req.body;

    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({ message: "Active loan reference file not found in core registry." });
    }

    // Duplicate submission safety protocol check
    const existingPayment = await Payment.findOne({ utr: utr.trim() });
    if (existingPayment) {
      return res.status(400).json({ error: "⚠️ Security Notice: This UTR number has already been submitted for review." });
    }

    const payment = await Payment.create({
      loanId: loan.loanId,
      customerId: loan.customerId,
      customerName: loan.customerName,
      amount: Number(amount),
      status: "Pending", // Forced to pending for Accountant verification
      paymentMethod: "Manual QR",
      gateway: "Manual",
      utr: utr.trim(),
      screenshot: screenshot, // Base64 string payload
      remarks: remarks || "Manual QR snapshot transmitted from customer dashboard terminal."
    });

    return res.status(201).json({
      success: true,
      message: "Payment receipt logged successfully under accountant review queue.",
      paymentId: payment.paymentId
    });

  } catch (err) {
    console.error("🚨 Manual Payment Submission Exception:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// =====================================
// APPROVE DIRECT REPAYMENT (OFFICER PRE-APPROVED FORCE ACCESS)
// =====================================
router.post("/approve-direct-repayment", verifyToken, allowRoles("admin", "accountant", "officer", "field officer", "fieldofficer", "advisor", "user"), async (req, res) => {
  try {
    const { loanId, amount, remarks } = req.body;

    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({ message: "Active loan reference not found in core infrastructure." });
    }

    const transactionAmount = Number(amount);

    const payment = await Payment.create({
      loanId: loan.loanId,
      customerId: loan.customerId,
      customerName: loan.customerName,
      amount: transactionAmount,
      status: "Approved",
      paymentMethod: "Manual QR", 
      gateway: "Manual",
      verifiedAt: new Date(),
      verifiedBy: req.user?.id || "System Advisor",
      remarks: remarks || "Direct Repayment Authorized by Advisor/Officer Panel"
    });

    await Loan.findOneAndUpdate(
      { loanId: loan.loanId },
      {
        $inc: { totalPaid: transactionAmount, totalPending: -transactionAmount },
        $push: {
          repaymentHistory: {
            amount: transactionAmount,
            utr: payment.paymentId,
            status: "Approved",
            date: new Date()
          }
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Direct collection repayment authorized and synced with master ledger balances.",
      paymentId: payment.paymentId
    });

  } catch (err) {
    console.error("🚨 Direct Repayment Engine Exception:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// =====================================
// CUSTOMER MANAGEMENT
// =====================================
router.get("/all-customers", verifyToken, allowRoles("admin", "accountant", "officer", "field officer", "fieldofficer", "advisor", "user"), async (req, res) => {
  try {
    const customers = await User.find({ role: { $in: ["user", "customer", "Customer", "User"] } }).select("-password").sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================
// STAFF MANAGEMENT
// =====================================
router.get("/all-staff", verifyToken, allowRoles("admin", "accountant"), async (req, res) => {
  try {
    const staff = await User.find({ role: { $ne: "user" } }).select("-password").sort({ role: 1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================
// LOAN MANAGEMENT
// =====================================
router.get("/all-loans", verifyToken, allowRoles("admin", "accountant", "officer", "field officer", "fieldofficer", "advisor", "user"), async (req, res) => {
  try {
    const loans = await Loan.find().populate("customerId", "-password").sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================
// DAILY COLLECTION REPORT
// =====================================
router.get("/collection-report", verifyToken, allowRoles("admin", "accountant", "officer", "field officer", "fieldofficer", "advisor", "user"), async (req, res) => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    const loans = await Loan.find();
    let report = [];

    loans.forEach((loan) => {
      loan.repaymentHistory?.forEach((pay) => {
        const payDate = new Date(pay.date || pay.paymentDate).setHours(0, 0, 0, 0);
        if (payDate === today && (pay.status === "Approved" || pay.status === "Success")) {
          report.push({
            loanId: loan.loanId,
            customerName: loan.customerName,
            amount: pay.amount,
            utr: pay.utr,
            date: pay.date || pay.paymentDate
          });
        }
      });
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================
// USER DELETE
// =====================================
router.delete("/users/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User removed successfully from cluster infrastructure." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;