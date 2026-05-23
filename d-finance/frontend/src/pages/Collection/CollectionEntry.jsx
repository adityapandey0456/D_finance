import React, { useState } from 'react';
import API from '../../api/axios'; 
import { FiSearch, FiUser, FiDollarSign, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const CollectionEntry = () => {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loanDetails, setLoanDetails] = useState(null);
  const [paymentData, setPaymentData] = useState({
    lateFine: 0,
    mode: 'UPI/Online',
    remarks: ''
  });

  // 1. Unified Search Functionality (Name, Mobile number, or Loan ID)
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return alert("Bhai, Loan ID, Name ya Mobile Number toh daalo!");

    try {
      setLoading(true);
      const res = await API.get(`/admin/all-loans`); 
      const loansList = Array.isArray(res.data) ? res.data : [];

      // 🔥 Mapped according to your live schema structural log
      const foundLoan = loansList.find(l => 
        (l?.loanId && l.loanId.toLowerCase() === searchId.trim().toLowerCase()) || 
        (l?.customerName && l.customerName.toLowerCase().includes(searchId.trim().toLowerCase())) ||
        (l?.customerMobile && l.customerMobile === searchId.trim()) ||
        (l?.customerId?.mobile && l.customerId.mobile === searchId.trim())
      );

      if (foundLoan) {
        setLoanDetails(foundLoan);
        console.log("Database Node Pull Success:", foundLoan);
      } else {
        alert("Record Not Found! Sahi ID, Name ya Phone number daalo.");
        setLoanDetails(null);
      }
    } catch (err) {
      console.error("Search Operational Error:", err);
      alert("Database context pull failed.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic dynamic evaluation calculation check for active payment cycle amount
  const activeEmiAmount = Number(loanDetails?.installmentAmount || loanDetails?.weeklyEMI || loanDetails?.dailyEMI || 0);
  const finalTotalNet = activeEmiAmount + Number(paymentData.lateFine || 0);

  // 2. Submit Collection Execution Logic
  const handleCollect = async () => {
    if (!window.confirm(`Collect ₹${finalTotalNet} from ${loanDetails?.customerName}?`)) return;

    try {
      setLoading(true);
      const res = await API.post(`/accountant/collect-emi`, {
        loanId: loanDetails.loanId,
        amount: finalTotalNet,
        lateFine: Number(paymentData.lateFine || 0),
        mode: paymentData.mode,
        remarks: paymentData.remarks
      });

      if (res.data.success) {
        alert("✅ Payment Successful! Core Ledger Adjusted.");
        setLoanDetails(null);
        setSearchId('');
        setPaymentData({ lateFine: 0, mode: 'UPI/Online', remarks: '' });
      }
    } catch (err) {
      alert("❌ Payment Failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <style>{responsiveCSS}</style>
      
      {/* --- HEADER SYSTEM --- */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontWeight: 900, fontSize: '24px', color: '#0f172a', letterSpacing: '-0.5px' }}>💸 EMI RECOVERY POINT</h2>
        <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Process EMI Collection & Digital Receipts</p>
      </div>

      {/* --- SEARCH BOX CONTROL BAR --- */}
      <form onSubmit={handleSearch} className="responsive-form-row" style={searchCard}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={searchIcon} />
          <input 
            type="text" 
            placeholder="Enter Loan ID (e.g. LN-768994), Name, or Mobile..." 
            style={searchInput}
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} style={fetchBtn} className="responsive-btn">
          {loading ? 'Searching...' : 'Pull Records'}
        </button>
      </form>

      {/* --- DATA BOARD RESULTS CONTEXT --- */}
      {loanDetails && (
        <div className="responsive-grid" style={mainGrid}>
          
          {/* Left Block: Digital Ticket Data Ledger Summary */}
          <div style={summaryCard}>
            <div style={cardHeader}>
              <div style={badge}>ACTIVE RECOVERY FILE</div>
            </div>
            
            <h3 style={custName}>{loanDetails.customerName}</h3>
            <p style={loanIdText}>Internal Registry Reference: {loanDetails.loanId}</p>

            <div style={infoBox}>
              <div style={infoRow}><span>Sanctioned Principal</span><b>₹{loanDetails.amount}</b></div>
              <div style={infoRow}><span>Structured Installment</span><b>₹{activeEmiAmount} ({loanDetails.emiType || 'Daily'})</b></div>
              <div style={infoRow}><span>Total Pending Balance</span><b style={{color: '#ef4444'}}>₹{(loanDetails.totalPending || 0).toLocaleString()}</b></div>
            </div>

            <div style={receiptVisual}>
               <p style={{fontSize: '9px', fontWeight: 900, color: '#94a3b8', textAlign: 'center', marginBottom: '12px', letterSpacing: '1px'}}>LEDGER STATEMENT REPAYMENT PREVIEW</p>
               <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#0f172a'}}>
                  <span>Total Net Receivable:</span>
                  <span style={{color: '#10b981'}}>₹{finalTotalNet.toLocaleString()}</span>
               </div>
            </div>
          </div>

          {/* Right Block: Manual Collection Entry Form Inputs */}
          <div style={formCard}>
             <h4 style={formTitle}><FiDollarSign/> Operational Ledger Parameters</h4>
             
             <div style={inputGroup}>
               <label style={labelStyle}>Apply Delayed Fine Penalty (₹)</label>
               <input 
                 type="number" 
                 style={formInput} 
                 value={paymentData.lateFine}
                 min="0"
                 onChange={(e) => setPaymentData({...paymentData, lateFine: e.target.value})}
               />
             </div>

             <div style={inputGroup}>
               <label style={labelStyle}>Payment Pipeline Channel</label>
               <select 
                 style={formInput}
                 value={paymentData.mode}
                 onChange={(e) => setPaymentData({...paymentData, mode: e.target.value})}
               >
                 <option value="UPI/Online">UPI / Digital QR Code</option>
                 <option value="Cash">Direct Physical Cash</option>
                 <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
               </select>
             </div>

             <div style={inputGroup}>
               <label style={labelStyle}>Official Entry Remarks / Notes</label>
               <input 
                 type="text"
                 placeholder="e.g. Field collected by officer node"
                 style={formInput}
                 value={paymentData.remarks}
                 onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
               />
             </div>

             <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'25px'}}>
               <button onClick={handleCollect} disabled={loading} style={confirmBtn}>
                 {loading ? 'Adjusting Database...' : 'Confirm & Reconcile Balances'}
               </button>
               <button type="button" onClick={() => setLoanDetails(null)} style={cancelBtn}><FiXCircle/> Cancel Entry Session</button>
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

// --- ENTERPRISE SCOPE SPECIFIC INLINE STYLES ---
const containerStyle = { padding: '25px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', boxSizing: 'border-box' };
const headerStyle = { marginBottom: '25px' };
const searchCard = { background: '#fff', padding: '16px', borderRadius: '20px', display: 'flex', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', border: '1px solid #e2e8f0', marginBottom: '25px', boxSizing: 'border-box' };
const searchIcon = { position: 'absolute', left: '20px', top: '18px', color: '#cbd5e1', zIndex: 10, fontSize: '18px' };
const searchInput = { width: '100%', padding: '16px 16px 16px 50px', borderRadius: '14px', border: '1.5px solid #f1f5f9', background: '#f8fafc', outline: 'none', fontWeight: '800', fontSize: '14px', boxSizing: 'border-box', color: '#0f172a' };
const fetchBtn = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: '14px', padding: '16px 30px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', tracking: '0.5px' };

const mainGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' };
const summaryCard = { background: '#fff', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0', boxSizing: 'border-box' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const badge = { background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' };
const custName = { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0f172a' };
const loanIdText = { margin: '4px 0 20px 0', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' };

const infoBox = { background: '#f8fafc', padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' };
const infoRow = { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontWeight: '700' };
const receiptVisual = { marginTop: '25px', padding: '18px', border: '2px dashed #e2e8f0', borderRadius: '16px', background: '#fdfefe' };

const formCard = { background: '#fff', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0', boxSizing: 'border-box' };
const formTitle = { margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '950', textTransform: 'uppercase', color: '#1e293b' };
const inputGroup = { marginBottom: '15px' };
const labelStyle = { display: 'block', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', tracking: '0.5px' };
const formInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontWeight: '800', fontSize: '13px', boxSizing: 'border-box', color: '#0f172a' };

const confirmBtn = { width: '100%', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', tracking: '0.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.2s' };
const cancelBtn = { width: '100%', background: 'none', border: 'none', color: '#94a3b8', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', textTransform: 'uppercase', tracking: '0.5px' };

// Global CSS Injections for Mobile Layout Adaptations
const responsiveCSS = `
  @media (max-width: 640px) {
    .responsive-form-row { flex-direction: column !important; gap: 10px !important; }
    .responsive-btn { width: 100% !important; padding: 14px 0 !important; }
    .responsive-grid { grid-template-columns: 1fr !important; }
  }
  .animate-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
`;

export default CollectionEntry;