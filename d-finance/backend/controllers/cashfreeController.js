const axios = require("axios");
const Payment = require("../models/Payment"); 
const Loan = require("../models/Loan");       
const User = require("../models/User");       
const { createOrder } = require("../services/cashfreeService");

// =========================================================================
// 1️⃣ CONTROLLER: CREATE EMI PAYMENT ORDER (Dynamic Production Registry)
// =========================================================================
exports.createEmiPaymentOrder = async (req, res) => {
  try {
    const { loanId, amount } = req.body;
    
    // 1. Core database registry lookup check
    const loan = await Loan.findOne({ loanId }); 
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Active loan reference not found in core registry."
      });
    }

    // 2. User profile deep fetch query for fallback compliance
    const userRecord = await User.findById(loan.customerId);

    // 🔥 PRODUCTION ENV DETECTION: Keys ke mutabik environment matrix select karo
    const isProd = process.env.CASHFREE_APP_ID && !process.env.CASHFREE_APP_ID.startsWith("TEST");
    const orderId = `${isProd ? "CF_PROD" : "CF_TEST"}_${loanId}_${Date.now()}`;

    // Hybrid Phone & Email Normalization Engine
    const basePhone = loan.customerMobile || userRecord?.mobile || "9999999999"; 
    const cleanPhone = basePhone.replace(/\D/g, "").slice(-10);
    const cleanEmail = userRecord?.email || "customer@dfinance.space";

    // 3. Database ledger file creation
    await Payment.create({
      loanId: loan.loanId,
      customerId: loan.customerId, 
      customerName: loan.customerName || userRecord?.fullName || "Verified Client", 
      amount: parseFloat(amount),
      orderId: orderId,
      status: "Pending",
      paymentMethod: "Cashfree",
      gateway: "Cashfree"
    });

    // 4. Cashfree API Payload Compilation
    const orderRequest = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: String(loan.customerId), 
        customer_phone: cleanPhone,
        customer_name: loan.customerName || userRecord?.fullName || "Verified Client", 
        customer_email: cleanEmail
      },
      order_tags: {
        "Loan_ID": String(loanId)
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'https://dfinance.space'}/customer/dashboard?order_id={order_id}`
      }
    };

    // 5. Gateway handshake request trigger
    const response = await createOrder(orderRequest);

    if (response && response.data) {
      return res.status(200).json({
        success: true,
        orderId: orderId,
        payment_session_id: response.data.payment_session_id, 
        cf_order_id: response.data.cf_order_id
      });
    }

    throw new Error("Empty response object payload received from gateway cluster.");

  } catch (error) {
    console.log("========== CASHFREE API CRITICAL ERROR ==========");
    console.error("Message:", error.message);
    if (error.response?.data) {
      console.error("Gateway Payload Error:", error.response.data);
    }
    console.log("====================================================");

    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || "Payment Gateway Handshake Failed"
    });
  }
};


// =========================================================================
// 2️⃣ CONTROLLER: WEBHOOK ENGINE (Atomic Ledger Mutations)
// =========================================================================
exports.handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log(`📥 CASHFREE WEBHOOK EVENT: [${type}]`);

    if (type === "ORDER_PAID") {
      const orderId = data.order.order_id;
      const cfPaymentId = String(data.payment.cf_payment_id);
      const transactionAmount = Number(data.order.order_amount);

      const payment = await Payment.findOne({ orderId }); 

      if (!payment) {
        return res.status(200).send("Record reference missing");
      }

      // Idempotency Lock: Stop double allocation mutations
      if (payment.status === "Approved") {
        return res.status(200).send("Already processed and mutated.");
      }

      // Ledger reference state shifting
      payment.status = "Approved";
      payment.utr = cfPaymentId;
      payment.cfPaymentId = cfPaymentId;
      payment.verifiedAt = new Date();
      await payment.save();

      // Core balance ledger execution pipeline
      await Loan.findOneAndUpdate(
        { loanId: payment.loanId },
        {
          $inc: { totalPaid: transactionAmount, totalPending: -transactionAmount }, 
          $push: {
            repaymentHistory: {
              amount: transactionAmount,
              utr: cfPaymentId,
              status: "Approved",
              date: new Date() 
            }
          }
        }
      );
      console.log(`✅ Webhook Ledger: Balance Deducted successfully for Order ${orderId}`);
    }
    return res.status(200).send("OK");
  } catch (err) {
    console.error("🚨 Webhook Engine Mutation Crash:", err.message);
    return res.status(500).send("Internal Error Interruption");
  }
};


// =========================================================================
// 3️⃣ CONTROLLER: GET PAYMENT STATUS (Automated Self-Healing Sync Engine)
// =========================================================================
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId }); 
    if (!payment) {
      return res.status(404).json({ success: false, message: "Transaction file record missing" });
    }

    if (payment.status === "Approved") {
      return res.json({ success: true, status: "Approved", amount: payment.amount });
    }

    // Dynamic verification endpoint switcher based on context
    const isProd = process.env.CASHFREE_APP_ID && !process.env.CASHFREE_APP_ID.startsWith("TEST");
    const baseURL = isProd 
      ? `https://api.cashfree.com/pg/orders/${orderId}` 
      : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

    const cfResponse = await axios.get(baseURL, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    // Integrity data checking logic
    if (cfResponse.data?.order_status === "PAID") {
      payment.status = "Approved";
      payment.utr = String(cfResponse.data.cf_order_id || orderId);
      payment.cfOrderId = String(cfResponse.data.cf_order_id);
      payment.verifiedAt = new Date();
      await payment.save();

      // Core system balance sync engine fallback loop execution
      await Loan.findOneAndUpdate(
        { loanId: payment.loanId },
        {
          $inc: { totalPaid: payment.amount, totalPending: -payment.amount }, 
          $push: {
            repaymentHistory: {
              amount: payment.amount,
              utr: payment.utr,
              status: "Approved",
              date: new Date() 
            }
          }
        }
      );
      console.log(`✅ Sync Engine Ledger: Self-Healed & Balance Deducted for Order ${orderId}`);
      return res.json({ success: true, status: "Approved", amount: payment.amount });
    }

    return res.json({ success: true, status: payment.status, amount: payment.amount });

  } catch (err) {
    console.error("🚨 Sync Engine Status Integrity Failure:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};