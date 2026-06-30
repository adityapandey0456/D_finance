import React, { useState } from "react";
import API from "../../api/axios";
import {
  FiX,
  FiShield,
  FiLoader,
  FiHash,
  FiUploadCloud,
  FiCheckCircle
} from "react-icons/fi";
import { BsQrCode } from "react-icons/bs"; 

const PaymentModal = ({ loan, onClose, onRefresh, customAmount }) => {
  const [loading, setLoading] = useState(false);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [uploadName, setUploadName] = useState("");

  const paymentAmount = customAmount || loan.customAmount || loan.installmentAmount || loan.dailyEMI || 0;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result); 
    };
    reader.readAsDataURL(file);
  };

  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();

    if (!utr.trim() || utr.length < 6) {
      return alert("⚠️ Security Alert: Please type a valid transaction UTR or Ref number.");
    }
    if (!screenshot) {
      return alert("📸 Mandatory Evidence Required: Please upload the payment confirmation screenshot.");
    }

    setLoading(true);

    const paymentPayload = {
      loanId: loan.loanId,
      amount: Number(paymentAmount),
      utr: utr.trim(),
      screenshot: screenshot, 
      remarks: "MANUAL QR DISPATCH: Submitted by Customer via secure portal terminal queue."
    };

    try {
      // 🔥 TARGETS DETECTED CUSTOMER CLEARANCE ROUTE AT BACKEND
      const response = await API.post("/admin/submit-pending-payment", paymentPayload);

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        alert("🎉 Payment Evidence Dispatched! Receipt moved to Accountant Verification Queue.");
        if (typeof onRefresh === "function") onRefresh();
        onClose();
      }
    } catch (err) {
      console.error("Manual Entry Pipeline Exception:", err);
      alert(err.response?.data?.error || err.response?.data?.message || "Vault transaction handshake error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 md:p-8 shadow-2xl my-auto animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto custom-scroll">
        
        {/* --- HEADER CONTROLS --- */}
        <div className="flex justify-between items-center mb-5 select-none">
          <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 uppercase tracking-wider font-sans">
            <FiShield size={12} />
            D-Finance Secure Node
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all active:scale-90"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* --- DYNAMIC LEDGER DATA --- */}
        <div className="text-center mb-6 border-b border-slate-100 pb-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Manual QR Settlement Channel
          </p>
          <h3 className="text-xl font-black text-slate-900 mt-1 uppercase tracking-tight">
            {loan.customerName || "System Profile"}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-slate-500 font-bold">
            <span>FILE ID: {loan.loanId}</span>
          </div>
          
          <div className="my-4 bg-slate-50 rounded-2xl py-3 border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Payable Installment Volume</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              ₹{Number(paymentAmount).toLocaleString('en-IN')}
            </h1>
          </div>
        </div>

        {/* --- QR ROUTING GRID --- */}
        <div className="flex flex-col items-center justify-center mb-6 bg-gradient-to-b from-slate-50 to-white border border-slate-200/60 p-4 rounded-3xl shadow-inner">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <BsQrCode /> Scan Official Code Module
          </div>
          
          <div className="w-48 h-48 bg-white border-2 border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-2 relative shadow-md group">
            <img 
              src="/Payment.jpeg" 
              alt="Official Settlement QR Gateway"
              className="w-full h-full object-contain"
              onError={(e) => {
                // e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=dfinance@upi&am=${paymentAmount}&tn=${loan.loanId}`;
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-bold text-center mt-3 leading-tight">
            Scan via PhonePe, GPay, Paytm or Any Banking App
          </p>
        </div>

        {/* --- EVIDENCE REGISTRATION FORM --- */}
        <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FiHash /> Input Transaction UTR Code
            </label>
            <input 
              type="text"
              required
              placeholder="Enter 12-Digit UTR or Bank Ref Number"
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-black outline-none focus:border-slate-900 focus:bg-white transition-all tracking-wide text-slate-800 uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FiUploadCloud /> Upload Receipt Snapshot
            </label>
            
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/50 text-center cursor-pointer transition-colors">
              <input 
                type="file"
                accept="image/*"
                required={!screenshot}
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="flex flex-col items-center justify-center gap-1 select-none">
                <FiUploadCloud className={screenshot ? "text-emerald-500" : "text-slate-400"} size={22} />
                <span className="text-xs font-extrabold text-slate-700 truncate max-w-full block px-2">
                  {uploadName || "Click to Browse Screenshot"}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">JPEG or PNG Evidence Capture</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg mt-2"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Transmitting Data Blocks...
              </>
            ) : (
              "Submit Verification Ticket"
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default PaymentModal;