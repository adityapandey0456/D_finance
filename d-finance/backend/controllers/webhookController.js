const Loan = require('../models/Loan');
const Payment = require('../models/Payment'); // Core collection history tracking model

exports.cashfreeWebhookReceiver = async (req, res) => {
    try {
        const { data } = req.body;
        
        // 1. Structural Layer Verification: Check if layout keys are accurate
        if (!data || !data.order || !data.payment) {
            console.log("⚠️ Webhook hit received with non-actionable nested body schema.");
            return res.status(200).send("Action Skipped - Missing Payload Node");
        }

        const orderStatus = data.order.order_status;
        const orderId = data.order.order_id;
        const amountPaid = Number(data.order.order_amount);
        const transactionGatewayId = data.payment.cf_payment_id || `CF_TXN_${Date.now()}`;

        // Strictly capture only successful webhook response codes
        if (orderStatus === "SUCCESS") {
            
            // Extract loanId dynamically from unique structural pattern split key index
            // Formula definition: "CF_EMI_LN-185396_171653..."
            const parts = orderId.split('_');
            const targetLoanId = parts[2] ? parts[2].trim() : null; 

            if (!targetLoanId) {
                console.error("❌ Failed to parse loanId substring from Cashfree pattern reference.");
                return res.status(200).send("OK"); // Respond 200 to cashfree so it drops the broken stack
            }

            // 🔥 PROTECTION FILTER: Anti-Idempotency/Duplicate Entry Check Matrix
            // Check if this transaction asset token is already reconciled in Payment ledger
            const existingPaymentRecord = await Payment.findOne({ utr: transactionGatewayId });
            if (existingPaymentRecord) {
                console.log(`🛡️ Double Hit Preventive Block: Token ${transactionGatewayId} is already processed.`);
                return res.status(200).send("OK"); // Respond 200 immediately to break network loop
            }

            // 2. Fetch specific account profile registry from MongoDB clusters
            const loan = await Loan.findOne({ loanId: targetLoanId });
            
            if (loan) {
                // Dynamic Balance Calculations Matrix
                const previousPending = Number(loan.totalPending || 0);
                const previousPaid = Number(loan.totalPaid || 0);
                const runningInstallmentCount = Number(loan.paidInstallments || 0);

                // Reconcile outstanding figures mathematically bounds
                const updatedPending = Math.max(0, previousPending - amountPaid);
                const updatedPaid = previousPaid + amountPaid;

                // Update properties directly on current active data document
                loan.totalPending = updatedPending;
                loan.totalPaid = updatedPaid;
                loan.paidInstallments = runningInstallmentCount + 1;
                
                // Pipeline lifecycle control switch
                if (updatedPending <= 0) {
                    loan.status = "Closed";
                }

                await loan.save();

                // 🔥 LIVE SYNC MATRIX: Create a receipt entry in Payment Schema model
                // Taaki ye entry automatic accountant/admin ke dynamic reports ledger me live ho jaye
                const newReceipt = new Payment({
                    loanId: loan.loanId,
                    customerName: loan.customerName,
                    amount: amountPaid,
                    paymentDate: data.payment.payment_time || new Date().toISOString(),
                    method: "UPI", // Automatically flagged as app intent transaction type
                    utr: transactionGatewayId, // Cashfree transaction reference identification code
                    receiptId: `REC_CF_${Date.now()}`,
                    status: "Approved", // Fixed status matching EMIPayments table rules filter
                    approvedBy: "CASHFREE_GATEWAY",
                    remarks: `Instant dynamic transaction settled via app gateway intent hook token`
                });

                await newReceipt.save();
                console.log(`🚀 Net Reconciled & Receipt Captured! File: ${targetLoanId} | Deducted Amount: ₹${amountPaid} | Txn ID: ${transactionGatewayId}`);
            } else {
                console.error(`❌ Data Fetch Mismatch: Loan account file code ${targetLoanId} signature broken.`);
            }
        } else {
            console.log(`ℹ️ Webhook state context noted: Order ${orderId} state is ${orderStatus}. No balance changes executed.`);
        }

        // Return status 200 strictly back to Cashfree server matrix to finalize handshake thread
        return res.status(200).send("OK");

    } catch (err) {
        console.error("❌ Critical Webhook Sync Broken Node Engine Error:", err.message);
        // Respond with 500 error code so that cashfree retries the handshake on runtime failures
        return res.status(500).send("Internal Server Processing Error");
    }
};