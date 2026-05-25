const { Cashfree } = require('cashfree-pg');

// Initialize SDK
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
// Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION; 
// Agar upar wala error de, toh ise try karo:
Cashfree.XEnvironment = "PRODUCTION";

exports.createEmiPaymentOrder = async (req, res) => {
    try {
        const { loanId, amount } = req.body;
        
        const request = {
            order_amount: amount,
            order_currency: "INR",
            order_id: "ORD_" + Date.now(),
            customer_details: { customer_id: loanId, customer_phone: "9999999999" },
            order_meta: { return_url: "http://localhost:5173/payment-success" }
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        res.json({ payment_session_id: response.data.payment_session_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};