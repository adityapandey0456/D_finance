const Payment = require('../models/Payment');
const Loan = require('../models/Loan');

exports.rejectPayment = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Payment find karo
        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment record not found" });
        }

        // 2. Loan balance adjust karo (Reverse the payment)
        // Agar payment 'Credit' thi, toh totalPaid se amount minus karo
        await Loan.findOneAndUpdate(
            { loanId: payment.loanId },
            { 
                $inc: { 
                    totalPaid: -payment.amount, 
                    totalPending: payment.amount 
                } 
            }
        );

        // 3. Payment record delete ya update status (Delete best hai agar record wrong tha)
        await Payment.findByIdAndDelete(id);

        res.status(200).json({ 
            success: true, 
            message: "Payment rejected, Loan balance reverted, and record removed." 
        });
    } catch (err) {
        console.error("❌ Rejection Error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Server Error during rejection", 
            details: err.message 
        });
    }
};