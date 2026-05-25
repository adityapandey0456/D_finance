const Payment = require('../models/Payment');
const Loan = require('../models/Loan');

// --- 1. Manual Payment Submission ---
exports.payManual = async (req, res) => {
    try {
        const { loanId } = req.params;
        const { 
            utr, 
            amount, 
            customerId, 
            customerName, 
            screenshot, 
            paymentType 
        } = req.body;

        // Duplicate UTR Check
        const existingPay = await Payment.findOne({ utr });
        if (existingPay && utr !== "CASHFREE_PAY") {
            return res.status(400).json({ 
                success: false, 
                error: "This UTR/Transaction ID has already been submitted!" 
            });
        }

        // Create Payment Record
        const newPayment = new Payment({
            paymentId: "PAY-" + Date.now(),
            loanId: loanId,
            customerId: customerId,
            customerName: customerName,
            amount: Number(amount),
            utr: utr,
            screenshot: screenshot,
            status: 'Pending',
            paymentDate: new Date()
        });

        await newPayment.save();
        console.log(`✅ Receipt for ${amount} received from ${customerName} (Loan: ${loanId})`);

        res.status(200).json({ 
            success: true, 
            message: "Payment receipt submitted successfully! Admin will verify soon." 
        });
    } catch (err) {
        console.error("❌ Payment Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to submit receipt", 
            details: err.message 
        });
    }
};

// --- 2. Required Stubs for Payment Routes (TAAKI ERROR NA AAYE) ---
exports.createOrder = async (req, res) => {
    res.status(200).json({ success: true, message: "Order creation logic ready" });
};

exports.verifyAndSavePayment = async (req, res) => {
    res.status(200).json({ success: true, message: "Verification logic ready" });
};

exports.handleWebhook = async (req, res) => {
    console.log("📡 Webhook hit received!");
    res.status(200).send("OK");
};