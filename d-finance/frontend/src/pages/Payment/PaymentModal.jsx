import React, { useState } from 'react';
import API from '../../api/axios';
import { load } from "@cashfreepayments/cashfree-js";
import { FiX, FiShield, FiLoader } from 'react-icons/fi';

const PaymentModal = ({ loan, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);

 // PaymentModal.jsx
const handleCashfreePayment = async () => {
    setLoading(true);
    try {
      // route ko '/api/create-order' karo
      const { data } = await API.post("/api/create-order", {
        loanId: loan.loanId,
        amount: loan.installmentAmount,
        customer_id: loan.loanId, // Backend requirement
        customer_phone: "9999999999" // Backend requirement
      });

      // ... rest of code

      // 2. Cashfree SDK trigger
      const cashfree = await load({ mode: "production" });
      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal"
      });

      // 3. Success ke baad refresh
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1">
            <FiShield size={12}/> D-FINANCE SECURE
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><FiX/></button>
        </div>

        <div className="text-center mb-6">
          <p className="text-[9px] font-black text-slate-400 uppercase">Processing Payment</p>
          <h3 className="text-lg font-black">{loan.customerName}</h3>
          <h1 className="text-4xl font-black italic my-2">₹{loan.installmentAmount.toLocaleString()}</h1>
        </div>

        <button 
          onClick={handleCashfreePayment} 
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[12px] uppercase flex items-center justify-center gap-2"
        >
          {loading ? <FiLoader className="animate-spin" /> : "Pay via Cashfree"}
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;