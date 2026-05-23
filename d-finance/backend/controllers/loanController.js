const Loan = require('../models/Loan');
const Payment = require('../models/Payment');

// --- 1. UPDATE LOAN STATUS & GEOTAG COORDINATES ---
exports.updateLoanVerification = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // 🔥 NEW: Check if frontend sent coordinates and format them correctly for MongoDB
        if (req.body.coordinates) {
            updateData.coordinates = {
                lat: req.body.coordinates.lat || "",
                lng: req.body.coordinates.lng || ""
            };
        }

        const updatedLoan = await Loan.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true } // Validations apply honge updates par bhi
        );

        if (!updatedLoan) {
            return res.status(404).json({ success: false, error: "Loan not found" });
        }

        res.status(200).json(updatedLoan);
    } catch (err) {
        console.error("❌ Loan Update Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 2. SUBMIT MANUAL PAYMENT (Image & Validation Fix) ---
exports.payManual = async (req, res) => {
    try {
        const { loanId } = req.params;
        const data = req.body; 

        // 🔍 VS Code Terminal Debugging
        console.log("Loan ID Param:", loanId);
        console.log("Customer:", data?.customerName);
        console.log("UTR:", data?.utr);
        console.log("Screenshot Raw Length:", data?.screenshot ? data.screenshot.length : "EMPTY (0)"); 
  
        if (!data?.screenshot || data.screenshot.length < 100) {
            return res.status(400).json({ success: false, error: "Server received empty image. Please re-upload screenshot." });
        }

        // Duplicate UTR check (Null and empty string proof)
        if (data.utr && !["CASHFREE_PAY", "N/A", "", "NONE"].includes(data.utr.toUpperCase().trim())) {
            const existingUTR = await Payment.findOne({ utr: data.utr.trim() });
            if (existingUTR) {
                return res.status(400).json({ success: false, error: "UTR already exists!" });
            }
        }

        const newPayment = new Payment({
            loanId: loanId || data.loanId,
            customerId: data.customerId,
            customerName: data.customerName,
            amount: Number(data.amount || 0),
            utr: data.utr || "N/A",
            screenshot: data.screenshot, 
            status: 'Pending',
            paymentDate: new Date()
        });

        await newPayment.save();
        res.status(200).json({ success: true, message: "Receipt saved successfully!" });
    } catch (err) {
        console.error("❌ Critical Save Error:", err.message);
        res.status(500).json({ success: false, error: "Database rejected the image. Check field type." });
    }
};

// --- 3. REJECT & DELETE RECEIPT ---
exports.rejectPayment = async (req, res) => {
    try {
        const deleted = await Payment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, error: "Already deleted." });
        res.status(200).json({ success: true, message: "🚫 Receipt Removed." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 4. APPROVE PAYMENT (With Repayment Ledger Integrity) ---
exports.approvePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { loanId, amount, utr } = req.body;

        const loan = await Loan.findOne({ loanId: loanId });
        if (!loan) return res.status(404).json({ success: false, error: "Loan ID mismatch!" });

        // Safe setup for arrays if missing
        if (!loan.repaymentHistory) {
            loan.repaymentHistory = [];
        }

        // History entry
        loan.repaymentHistory.push({
            amount: Number(amount || 0),
            utr: utr || "Manual_Verified",
            date: new Date(),
            status: 'Approved'
        });

        // Balance math with safety fallbacks
        const currentPending = Number(loan.totalPending || 0);
        const currentPaid = Number(loan.totalPaid || 0);
        const paidAmount = Number(amount || 0);

        loan.totalPending = Math.max(0, currentPending - paidAmount);
        loan.totalPaid = currentPaid + paidAmount;

        await loan.save();
        await Payment.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Verified!" });
    } catch (err) {
        console.error("❌ Payment Approval Error:", err.message);
        res.status(500).json({ success: false, error: "Approval failed." });
    }
};