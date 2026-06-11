const axios = require("axios"); // 🔥 Joda gaya status check ke liye
const Payment = require("../models/Payment");
const Loan = require("../models/Loan"); // 🔥 Joda gaya loan ledger update ke liye
const { createOrder } = require("../services/cashfreeService");

// 1. CREATE ORDER CONTROLLER (Aapka purana code - UNCHANGED)
exports.createEmiPaymentOrder = async (req, res) => {
  try {
    const { loanId, amount, customer_id, customer_phone } = req.body;
    
    // Sandbox test tracing ke liye ek unique transaction order id
    const orderId = `CF_TEST_${loanId}_${Date.now()}`;

    // ⚡ SAFEGUARD: Cashfree sandbox phone parameters ke liye strict hai (strips country codes & spaces)
    const cleanPhone = customer_phone ? customer_phone.replace(/\D/g, "").slice(-10) : "9999999999";

    // 1. Database mein pending ledger reference generate karo
    await Payment.create({
      loanId,
      customerId: customer_id,
      amount,
      orderId,
      status: "Pending",
      paymentMethod: "Cashfree"
    });

    // 2. Cashfree API Payload Matrix taiyar karo
    const orderRequest = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: String(customer_id),
        customer_phone: cleanPhone,
        customer_email: "test_customer@dfinance.space" // Sandbox fallback email
      },
      order_meta: {
        // 🔥 FIX: payment-success hata kar seedha customer dashboard par redirect karo
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/dashboard?order_id={order_id}`
      }
    };

    // 3. Cashfree Sandbox API call handshake trigger karo
    const response = await createOrder(orderRequest);

    // 4. Response check karo aur payment_session_id frontend ko hand over karo
    if (response && response.data) {
      return res.status(200).json({
        success: true,
        orderId: orderId,
        payment_session_id: response.data.payment_session_id, // 🔥 Frontend demands this
        cf_order_id: response.data.cf_order_id
      });
    }

    throw new Error("Empty response object payload received from gateway cluster.");

  } catch (error) {
    console.log("========== CASHFREE SANDBOX CRITICAL ERROR ==========");
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


// 2. WEBHOOK CONTROLLER (Updated with Automatic Ledger Deduction)
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

      // IDEMPOTENCY CHECK: Double update block karne ke liye
      if (payment.status === "Approved") {
        return res.status(200).send("Already processed");
      }

      // Update payment doc
      payment.status = "Approved";
      payment.utr = cfPaymentId;
      payment.verifiedAt = new Date();
      await payment.save();

      // Loan amount se cut karo
      await Loan.findOneAndUpdate(
        { loanId: payment.loanId },
        {
          $inc: { totalPaid: transactionAmount, totalPending: -transactionAmount },
          $push: {
            repaymentHistory: {
              amount: transactionAmount,
              utr: cfPaymentId,
              status: "Approved",
              paymentDate: new Date()
            }
          }
        }
      );
      console.log(`✅ Webhook: Balance Deducted for Order ${orderId}`);
    }
    return res.status(200).send("OK");
  } catch (err) {
    console.error("🚨 Webhook Engine Error:", err.message);
    return res.status(500).send("Internal Error");
  }
};


// 3. GET PAYMENT STATUS CONTROLLER (Updated with Self-Healing Sync Engine)
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Record missing" });
    }

    // Agar pehle hi webhook se approve ho chuka hai, direct return karo
    if (payment.status === "Approved") {
      return res.json({ success: true, status: "Approved", amount: payment.amount });
    }

    // Cashfree Gateway se direct live verification sync call
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

    // Agar gateway par status PAID hai aur hamare yahan Pending tha, toh instantly cut karo
    if (cfResponse.data?.order_status === "PAID") {
      payment.status = "Approved";
      payment.utr = orderId;
      payment.verifiedAt = new Date();
      await payment.save();

      await Loan.findOneAndUpdate(
        { loanId: payment.loanId },
        {
          $inc: { totalPaid: payment.amount, totalPending: -payment.amount },
          $push: {
            repaymentHistory: {
              amount: payment.amount,
              utr: payment.orderId,
              status: "Approved",
              paymentDate: new Date()
            }
          }
        }
      );
      console.log(`✅ Sync Engine: Balance Deducted for Order ${orderId}`);
      return res.json({ success: true, status: "Approved", amount: payment.amount });
    }

    return res.json({ success: true, status: payment.status, amount: payment.amount });

  } catch (err) {
    console.error("🚨 Sync Engine Status Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};