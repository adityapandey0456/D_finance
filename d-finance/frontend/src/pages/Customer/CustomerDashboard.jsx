import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // 🔥 Active kiya useSearchParams
import API from "../../api/axios";
import PaymentModal from "../Payment/PaymentModal"; 
import { 
  FiClock, FiCheckCircle, FiAlertCircle, FiActivity, 
  FiCreditCard, FiHash, FiInfo, FiArrowRight, FiXCircle 
} from 'react-icons/fi';

const CustomerDashboard = () => {
  
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // 🔥 URL Params Parser for Self-Healing Gateway Sync
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!user.id && !user._id) return;
    try {
      const [loanRes, payRes] = await Promise.all([
        API.get(`/loans?customerId=${user.id || user._id}`),
        API.get(`/payments?customerId=${user.id || user._id}`).catch(() => ({ data: [] })) 
      ]);
      setLoans(loanRes.data);
      setPayments(payRes.data || []);
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id, user._id]);

  // Existing Polling Sync Loop
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval); 
  }, [fetchData]);

  // 🔥 NEW: Real-time Automated Local Sync Engine Trigger
  useEffect(() => {
    const verifyAndSyncPayment = async () => {
      if (orderId) {
        try {
          console.log("🔄 Local Sync Engine Triggered for Order:", orderId);
          
          // Local Backend Engine ke status endpoint check pipeline ko hit karo
          const { data } = await API.get(`/payments/status/${orderId}`);
          
          console.log("📥 Sync Engine Validation Response:", data);

          if (data.status === "Approved") {
            alert(`🎉 Payment Verified! ₹${data.amount} successfully deducted from your loan liability.`);
            fetchData(); // Dashboard data ledger ko bina hard-refresh kiye instantly update karo
          } else {
            alert("Payment status is still processing or failed on gateway cluster.");
          }
        } catch (err) {
          console.error("🚨 Local Sync Hook Exception Fault:", err);
        } finally {
          // URL se query parameters saaf karo taaki user ke manual reload par loop back na ho
          setSearchParams({}); 
        }
      }
    };

    verifyAndSyncPayment();
  }, [orderId, setSearchParams, fetchData]);

  // --- 📊 LOGIC & CALCULATIONS ---
  const activeLoan = loans.find(l => l.status === 'Disbursed' || l.status === 'Approved');
  const pendingLoan = loans.find(l => ['Applied', 'Verification Pending', 'Field Verified'].includes(l.status));
  
  const totalPayable = activeLoan ? activeLoan.totalPayable : 0;
  
  const totalPaid = payments
    .filter(p => p.status === 'Approved')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalDue = activeLoan ? (activeLoan.totalPending || (totalPayable - totalPaid)) : 0;

  // Updated Gateway Trigger
  const openPayGateway = (loan) => {
    setSelectedLoan({
      ...loan,
      installmentAmount: loan.weeklyEMI || loan.installmentAmount || 0
    });
    setShowModal(true);
  };

  const getPaymentStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return { bg: '#dcfce7', text: '#15803d', icon: <FiCheckCircle size={12}/> };
      case 'Rejected': return { bg: '#fee2e2', text: '#b91c1c', icon: <FiXCircle size={12}/> };
      default: return { bg: '#fef3c7', text: '#92400e', icon: <FiClock size={12}/> };
    }
  };

  if (loading) return <div style={loaderStyle}>🔄 SYNCING YOUR ACCOUNT...</div>;

  return (
    <div style={container}>
      <style>{responsiveStyles}</style>

      {/* 1. Header */}
      <div style={headerFlex} className="header-flex">
        <div>
          <h2 style={portalTitle}>🚀 CUSTOMER TERMINAL</h2>
          <p style={welcomeText}>{user.fullName} | Branch: Mathura</p>
        </div>
        <button onClick={() => navigate('/customer/apply-loan')} style={applyBtn}>+ New Loan Request</button>
      </div>

      {/* 2. Enhanced Stats Grid */}
      <div style={grid4} className="grid-stats">
        <div style={card}>
            <span style={label}>Status</span>
            <p style={{ ...val, color: activeLoan ? '#10b981' : '#f59e0b' }}>
                {activeLoan ? '● Active' : pendingLoan ? '● Processing' : '● No Loan'}
            </p>
        </div>
        <div style={card}>
          <span style={label}>Principal</span>
          <p style={val}>₹{activeLoan ? activeLoan.amount.toLocaleString() : '0'}</p>
        </div>
        <div style={card}>
            <span style={label}>Total Paid</span>
            <p style={{ ...val, color: '#059669' }}>₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div style={card}>
            <span style={{...label, color:'#e11d48'}}>Remaining Due</span>
            <p style={{ ...val, color: '#e11d48' }}>₹{totalDue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* 3. Main Content */}
      <div style={mainGrid} className="main-grid">
        
        {/* Applications & Payment History */}
        <div style={leftCol}>
          {activeLoan && (
            <div style={activeAlert}>
              <FiCheckCircle size={24} color="#059669" />
              <div>
                <b style={{color: '#065f46'}}>Disbursement Successful</b>
                <p style={{margin: '2px 0 0 0', fontSize: '11px', color: '#047857'}}>Funds released to your registered bank account.</p>
              </div>
            </div>
          )}

          {/* --- 📜 LOAN APPLICATIONS LIST --- */}
          <div style={sectionCard}>
            <h4 style={sectionTitle}>📜 Loan Applications</h4>
            <div style={{overflowX: 'auto'}}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeader}><th>DATE</th><th>ID</th><th>CAPITAL</th><th>STATUS</th></tr>
                </thead>
                <tbody>
                  {loans.map(l => (
                    <tr key={l._id} style={tableRow}>
                      <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td style={{fontWeight: '900'}}>{l.loanId}</td>
                      <td style={{fontWeight: '700'}}>₹{l.amount.toLocaleString()}</td>
                      <td><span style={statusBadge(l.status)}>{l.status}</span></td>
                    </tr>
                  ))}
                  {loans.length === 0 && <tr><td colSpan="4" style={emptyRow}>No records.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- 💸 FULL PAYMENT HISTORY SECTION --- */}
          <div style={{...sectionCard, marginTop: '10px'}}>
            <h4 style={sectionTitle}>💸 Detailed Payment History</h4>
            <div style={historyList}>
              {payments.length > 0 ? payments.map((p) => {
                const statusStyle = getPaymentStatusStyle(p.status);
                return (
                  <div key={p._id} style={historyItem}>
                    <div style={historyMain}>
                      <div>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                          <span style={historyAmt}>₹{p.amount.toLocaleString()}</span>
                          <div style={{...miniBadge, background: statusStyle.bg, color: statusStyle.text}}>
                            {statusStyle.icon} {p.status}
                          </div>
                        </div>
                        <small style={historyDate}>
                          {new Date(p.createdAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})} • UTR: {p.utr}
                        </small>
                      </div>
                      <FiArrowRight color="#cbd5e1" />
                    </div>
                    {p.adminNote && (
                      <div style={noteBox}>
                        <FiInfo size={12} style={{marginTop:'2px'}} />
                        <span><b>Admin Note:</b> {p.adminNote}</span>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div style={emptyRow}>No payments made yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Repayment Sidebar */}
        <div className="sidebar">
          <div style={{...sectionCard, background: '#0f172a', color: '#fff'}}>
            <h4 style={{...sectionTitle, color: '#94a3b8'}}><FiActivity /> Payment Node</h4>
            {activeLoan ? (
              <div style={{textAlign: 'center'}}>
                <div style={emiDisplay}>
                  <span style={{fontSize:'10px', color:'#94a3b8', fontWeight:'bold'}}>CURRENT EMI DUE</span>
                  <h2 style={{fontSize: '32px', margin:'10px 0', fontWeight:'950'}}>₹{(activeLoan.weeklyEMI || activeLoan.installmentAmount || 0).toLocaleString()}</h2>
                  <div style={dueTag}>Loan ID: {activeLoan.loanId}</div>
                </div>
                
                <button onClick={() => openPayGateway(activeLoan)} style={payBtn}>Pay Now</button>
                
                <p style={{fontSize:'10px', color:'#64748b', marginTop:'15px'}}>
                   Instant settlement via Cashfree Gateway.
                </p>
              </div>
            ) : (
              <div style={lockedState}>
                <FiClock size={40} color="#334155" />
                <p style={{marginTop:'10px', color:'#64748b', fontSize:'12px'}}>No active EMI pending.</p>
              </div>
            )}
          </div>

          <div style={{...sectionCard, marginTop:'20px'}}>
             <h4 style={sectionTitle}>💳 Recent Receipts</h4>
             {payments.slice(0, 3).map(p => (
               <div key={p._id} style={receiptMini}>
                 <div>
                   <p style={{margin:0, fontSize:'11px', fontWeight:'bold'}}>{new Date(p.createdAt).toLocaleDateString()}</p>
                   <small style={{color:'#94a3b8'}}>{p.utr?.substring(0, 10)}...</small>
                 </div>
                 <b style={{color: p.status === 'Approved' ? '#10b981' : p.status === 'Rejected' ? '#ef4444' : '#f59e0b'}}>₹{p.amount}</b>
               </div>
             ))}
             {payments.length === 0 && <p style={emptyRow}>No payments found.</p>}
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal Frame Link */}
      {showModal && selectedLoan && (
        <PaymentModal 
          loan={selectedLoan} 
          onClose={() => setShowModal(false)} 
          onRefresh={fetchData} 
        />
      )}
    </div>
  );
};

// --- Styles Vector Definition ---
const container = { padding: '20px', maxWidth: '1100px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc' };
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const portalTitle = { margin: 0, fontWeight: '950', fontSize: '24px', color: '#0f172a' };
const welcomeText = { fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: '5px' };
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' };
const card = { background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' };
const label = { fontSize: '10px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase' };
const val = { fontSize: '22px', fontWeight: '900', marginTop: '5px' };
const mainGrid = { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' };
const leftCol = { display: 'flex', flexDirection: 'column', gap: '20px' };
const sectionCard = { background: '#fff', padding: '25px', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' };
const sectionTitle = { fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '20px', display:'flex', alignItems:'center', gap:'8px', color: '#475569' };
const activeAlert = { background: '#f0fdf4', padding: '15px', borderRadius: '20px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' };
const emiDisplay = { background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' };
const dueTag = { fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' };
const payBtn = { width: '100%', padding: '16px', background: '#fff', color: '#0f172a', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', transition: '0.3s' };
const applyBtn = { padding: '12px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' };
const receiptMini = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f1f5f9' };
const loaderStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#94a3b8', background: '#f8fafc' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeader = { textAlign: 'left', fontSize: '10px', color: '#94a3b8', paddingBottom: '15px' };
const tableRow = { borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const emptyRow = { textAlign:'center', padding:'30px', color:'#cbd5e1', fontSize:'12px', fontWeight:'700' };
const lockedState = { textAlign:'center', padding:'40px 0' };

// Payment History New Styles Definitions
const historyList = { display: 'flex', flexDirection: 'column', gap: '12px' };
const historyItem = { padding: '15px', borderRadius: '18px', background: '#f8fafc', border: '1px solid #f1f5f9' };
const historyMain = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const historyAmt = { fontSize: '18px', fontWeight: '900', color: '#0f172a' };
const historyDate = { fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' };
const miniBadge = { padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' };
const noteBox = { marginTop: '10px', padding: '10px', background: '#fff', borderRadius: '10px', fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', borderLeft: '3px solid #cbd5e1' };

const statusBadge = (s) => ({
  padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '900',
  background: ['Disbursed', 'Approved'].includes(s) ? '#dcfce7' : s === 'Rejected' ? '#fee2e2' : '#fef3c7',
  color: ['Disbursed', 'Approved'].includes(s) ? '#15803d' : s === 'Rejected' ? '#b91c1c' : '#92400e',
});

const responsiveStyles = `
  @media (max-width: 768px) {
    .main-grid { grid-template-columns: 1fr !important; }
    .header-flex { flex-direction: column; align-items: flex-start !important; gap: 15px; }
    .grid-stats { grid-template-columns: 1fr 1fr !important; }
    .sidebar { order: -1; }
  }
  .table-row td { padding: 12px 0; }
`;

export default CustomerDashboard;