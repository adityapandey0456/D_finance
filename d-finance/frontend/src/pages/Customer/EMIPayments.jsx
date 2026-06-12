import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios'; 
import PaymentModal from '../Payment/PaymentModal'; 
import { 
  FiArrowUpRight, FiArrowDownLeft, FiRefreshCw, FiChevronDown, 
  FiChevronUp, FiCalendar, FiAlertCircle, FiClock, FiCheckCircle, FiInfo 
} from 'react-icons/fi';

const EMIPayments = () => {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [payAmounts, setPayAmounts] = useState({});
  const [activeLedger, setActiveLedger] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || {};

  const fetchData = useCallback(async () => {
    if (!user.id && !user._id) return;
    setLoading(true);
    try {
      const cId = user.id || user._id;
      const [loanRes, payRes] = await Promise.all([
        API.get(`/loans?customerId=${cId}`),
        API.get(`/payments?customerId=${cId}`)
      ]);

      const active = (loanRes.data || []).filter(l => l.status === 'Disbursed');
      setLoans(active);
      
      const history = Array.isArray(payRes.data) ? payRes.data : [];
      setPayments(history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      const initAmt = {};
      active.forEach(l => { 
        initAmt[l._id] = l.installmentAmount || l.dailyEMI || 200; 
      });
      setPayAmounts(initAmt);
    } catch (err) {
      console.error("Ledger Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id, user._id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 📅 CALCULATE GLOBAL NEXT DUE DATE PARAMETER ---
  const getNextDueDate = (loan) => {
    const baseDate = new Date(loan.appliedDate || loan.updatedAt || Date.now());
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let nextDue = new Date(baseDate);
    if (loan.emiType === 'Weekly EMI') {
      nextDue.setDate(baseDate.getDate() + 7);
    } else {
      nextDue.setDate(baseDate.getDate() + 1);
    }

    if (nextDue < today) {
      return "OVERDUE TODAY";
    }
    return nextDue.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handlePay = (loan, amountOverride = null) => {
    const amt = amountOverride || Number(payAmounts[loan._id]);
    if (amt < 100) return alert("⚠️ Minimum payment ₹100 allowed.");
    setSelectedLoan({ ...loan, customAmount: amt });
    setShowModal(true);
  };

  return (
    <div className="ledger-container" style={masterPageStyle}>
      <style>{animations}</style>

      {/* --- HEADER --- */}
      <div style={headerSection} className="mobile-header">
        <div>
          <h2 style={titleStyles}>🏦 D-FINANCE LEDGER</h2>
          <p style={subStyles}>Real-time EMI Tracking & Verified Statements</p>
        </div>
        <button onClick={fetchData} style={syncBtn} className="hover-scale">
          <FiRefreshCw /> Sync Ledger
        </button>
      </div>

      {loading ? (
        <div style={loaderBox}>
            <div className="spinner"></div>
            <p style={{fontWeight: 'bold', color: '#64748b'}}>Verifying Database Integrity...</p>
        </div>
      ) : (
        <>
          {/* --- ACTIVE LOAN CARDS --- */}
          <div className="loan-grid" style={gridStyles}>
            {loans.length > 0 ? loans.map(loan => {
              const loanPayments = payments.filter(p => 
                p.loanId?.toString() === loan.loanId?.toString() && p.status?.toLowerCase() === 'approved'
              );
              
              const totalRepaid = loanPayments.reduce((sum, p) => sum + Number(p.amount), 0);
              const netRemaining = (Number(loan.totalPayable) || 0) - totalRepaid;
              const emiAmt = loan.installmentAmount || loan.dailyEMI || 200;
              const inputAmt = payAmounts[loan._id] || 0;
              const nextDate = getNextDueDate(loan);

              // Max dynamic rows calculation tracker
              const totalInstallmentsCount = loan.totalInstallments || 10;

              return (
                <div key={loan._id} style={cardStyles} className="card-hover">
                  <div style={cardHeader}>
                    <span style={loanIdTag}>FILE ID: {loan.loanId}</span>
                    <span style={liveBadge}>● {loan.emiType?.toUpperCase()}</span>
                  </div>

                  {/* 📅 GLOBAL OVERDUE CHECK BOX */}
                  <div style={{ ...dueInfoBox, background: nextDate.includes('OVERDUE') ? '#fff5f5' : '#f0f7ff', borderColor: nextDate.includes('OVERDUE') ? '#feb2b2' : '#dbeafe' }}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <FiCalendar color={nextDate.includes('OVERDUE') ? '#dc2626' : '#3b82f6'} />
                        <span style={{fontSize:'10px', fontWeight:'900', color: nextDate.includes('OVERDUE') ? '#9b1c1c' : '#64748b'}}>UPCOMING EMI DEADLINE</span>
                    </div>
                    <div style={{fontSize:'15px', fontWeight:'900', color: nextDate.includes('OVERDUE') ? '#dc2626' : '#0f172a', marginTop:'4px'}}>
                        {nextDate}
                    </div>
                  </div>

                  <div style={statsContainer}>
                    <div style={statBox}>
                      <label style={miniLabel}>EMI Amount</label>
                      <b style={statVal}>₹{emiAmt.toLocaleString('en-IN')}</b>
                    </div>
                    <div style={statDivider}></div>
                    <div style={statBox}>
                      <label style={miniLabel}>Outstanding Balance</label>
                      <b style={{...statVal, color: netRemaining <= 0 ? '#10b981' : '#f43f5e'}}>
                        ₹{netRemaining <= 0 ? '0' : netRemaining.toFixed(0).toLocaleString('en-IN')}
                      </b>
                    </div>
                  </div>

                  <div style={inputGroup}>
                    <label style={miniLabel}>Custom Amount to Pay (₹)</label>
                    <input 
                      type="number" 
                      style={inputBox}
                      value={inputAmt}
                      onChange={(e) => setPayAmounts({...payAmounts, [loan._id]: e.target.value})}
                    />
                  </div>

                  <button onClick={() => handlePay(loan)} style={mainPayBtn} className="hover-scale">
                    Pay Custom Installment (₹{inputAmt})
                  </button>

                  <button 
                    onClick={() => setActiveLedger(activeLedger === loan.loanId ? null : loan.loanId)} 
                    style={scheduleToggle}
                  >
                    {activeLedger === loan.loanId ? <><FiChevronUp/> Close Calendar Sheet</> : <><FiClock/> View Detailed EMI Dates Schedule</>}
                  </button>

                  {/* =========================================================================
                      🔥 DYNAMIC CALENDAR EMI SCHEDULE ENGINE (Shows explicit installment dates)
                     ========================================================================= */}
                  {activeLedger === loan.loanId && (
                    <div style={ledgerWrapper} className="fade-in">
                        <header style={ledgerHeader}>
                            <FiInfo /> PERSONALIZED AMORTIZATION TIMELINE SHEET
                        </header>
                        
                        <div style={ledgerScroll}>
                            {Array.from({ length: totalInstallmentsCount }).map((_, index) => {
                                const installmentNo = index + 1;
                                
                                // Calculate accurate sequence calendar date for each specific row item step
                                const milestoneDate = new Date(loan.appliedDate || loan.updatedAt || Date.now());
                                if (loan.emiType === 'Weekly EMI') {
                                  milestoneDate.setDate(milestoneDate.getDate() + (installmentNo * 7));
                                } else {
                                  milestoneDate.setDate(milestoneDate.getDate() + installmentNo);
                                }

                                const formattedMilestoneDate = milestoneDate.toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                });

                                // 🔥 Math Engine Evaluation: If total global repaid satisfies up to this specific tier level
                                const isThisRowSettled = totalRepaid >= (installmentNo * emiAmt);

                                return (
                                  <div key={installmentNo} style={{ ...ledgerRow, opacity: isThisRowSettled ? 0.6 : 1 }}>
                                      <span style={{ ...periodLabel, background: isThisRowSettled ? '#1e293b' : '#2563eb' }}>
                                        Inst-{installmentNo}
                                      </span>
                                      
                                      <div style={{ flex: 1, marginLeft: '12px' }}>
                                          <div style={rowAmt}>₹{emiAmt.toLocaleString('en-IN')}</div>
                                          <div style={{ fontSize: '10px', color: isThisRowSettled ? '#94a3b8' : '#60a5fa', fontWeight: 'bold', marginTop: '2px' }}>
                                              📅 Due on: {formattedMilestoneDate}
                                          </div>
                                      </div>

                                      {isThisRowSettled ? (
                                        <span style={innerPaidBadge}>✓ PAID</span>
                                      ) : (
                                        <button 
                                          onClick={() => handlePay(loan, emiAmt)} 
                                          style={payMiniBtn}
                                        >
                                          Pay
                                        </button>
                                      )}
                                  </div>
                                );
                            })}
                        </div>
                        <footer style={penaltyBox}>
                            <FiAlertCircle /> Late compliance settlement carries regular system structure guidelines buffer.
                        </footer>
                    </div>
                  )}
                </div>
              );
            }) : (
                <div style={emptyCard}>No active disbursements found in master client ledger.</div>
            )}
          </div>

          {/* --- TRANSACTION HISTORY --- */}
          <div style={historyCard}>
            <h3 style={tableHeading}><FiCheckCircle color="#10b981" /> Payment Intelligence History</h3>
            <div style={{overflowX: 'auto'}}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={tableHead}>
                            <th style={thStyle}>PAYMENT DATE</th>
                            <th style={thStyle}>UTR / REFERENCE ID</th>
                            <th style={thStyle}>AMOUNT</th>
                            <th style={thStyle}>LEDGER STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length > 0 ? payments.map((p, index) => {
                            const status = p.status?.toLowerCase();
                            return (
                                <tr key={index} style={trStyle}>
                                    <td style={tdStyle}>
                                        <div style={{fontWeight: '700', color: '#334155'}}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</div>
                                        <div style={{fontSize: '10px', color: '#94a3b8'}}>{new Date(p.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td style={{...tdStyle, fontFamily: 'monospace', color: '#6366f1', fontWeight: '800'}}>{p.utr}</td>
                                    <td style={{...tdStyle, fontWeight: '900', fontSize:'15px', color: '#0f172a'}}>₹{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                                    <td style={tdStyle}>
                                        <span style={statusBadge(
                                            status === 'approved' ? '#dcfce7' : status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                            status === 'approved' ? '#166534' : status === 'rejected' ? '#991b1b' : '#92400e'
                                        )}>
                                            {p.status?.toUpperCase() || 'SYNCING'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan="4" style={noData}>Secure vault empty. No verified payments found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </>
      )}

      {showModal && selectedLoan && (
        <PaymentModal 
          loan={selectedLoan} 
          customAmount={selectedLoan.customAmount} 
          onClose={() => setShowModal(false)} 
          onRefresh={fetchData} 
        />
      )}
    </div>
  );
};

// --- CORE COMPONENT VISUAL EMBEDDED STYLES ---
const masterPageStyle = { padding: '30px 4%', background: '#f8fafc', minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif' };
const headerSection = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' };
const titleStyles = { margin: 0, fontWeight: 950, fontSize: '26px', color: '#0f172a', letterSpacing: '-1px' };
const subStyles = { margin: '4px 0 0 0', color: '#64748b', fontSize: '13px', fontWeight: '600' };
const syncBtn = { background: '#0f172a', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' };

const gridStyles = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '25px', marginBottom: '40px' };
const cardStyles = { background: '#fff', padding: '25px', borderRadius: '32px', border: '1px solid #eef2f6', boxShadow: '0 15px 35px rgba(0,0,0,0.01)', position: 'relative' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' };
const loanIdTag = { fontSize: '10px', fontWeight: '900', color: '#2563eb', background: '#eff6ff', padding: '5px 12px', borderRadius: '8px' };
const liveBadge = { fontSize: '9px', fontWeight: '900', color: '#10b981', trackingSpace: '0.5px' };

const dueInfoBox = { padding: '12px 18px', borderRadius: '18px', border: '1px solid #dbeafe', marginBottom: '18px', transition: 'all 0.3s' };
const statsContainer = { display: 'flex', background: '#f8fafc', padding: '15px 18px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #f1f5f9', alignItems: 'center' };
const statBox = { flex: 1, textAlign: 'center' };
const statDivider = { width: '1px', height: '25px', background: '#e2e8f0' };
const miniLabel = { fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block', letterSpacing: '0.3px' };
const statVal = { fontSize: '18px', fontWeight: 950, color: '#0f172a' };

const inputGroup = { marginBottom: '15px' };
const inputBox = { width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #e2e8f0', fontSize: '18px', fontWeight: '900', textAlign: 'center', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' };
const mainPayBtn = { width: '100%', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)' };
const scheduleToggle = { width: '100%', background: 'none', border: 'none', marginTop: '12px', color: '#64748b', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' };

const ledgerWrapper = { marginTop: '20px', background: '#1e293b', borderRadius: '24px', padding: '18px', color: '#fff' };
const ledgerHeader = { fontSize: '9px', fontWeight: '900', color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' };
const ledgerScroll = { maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' };
const ledgerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #334155' };
const periodLabel = { padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', color: '#fff' };
const rowAmt = { fontSize: '13px', fontWeight: '900', color: '#fff' };
const payMiniBtn = { background: '#fff', color: '#0f172a', border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' };
const innerPaidBadge = { background: '#065f46', color: '#34d399', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px' };
const penaltyBox = { marginTop: '12px', fontSize: '10px', color: '#f87171', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' };

const historyCard = { background: '#fff', borderRadius: '32px', padding: '30px', border: '1px solid #eef2f6', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' };
const tableHeading = { marginBottom: '20px', fontSize: '16px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', textTransform: 'uppercase' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHead = { textAlign: 'left', borderBottom: '2px solid #f1f5f9' };
const thStyle = { padding: '12px 10px', color: '#94a3b8', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' };
const trStyle = { borderBottom: '1px solid #f8fafc' };
const tdStyle = { padding: '16px 10px', fontSize: '13px' };
const statusBadge = (bg, color) => ({ background: bg, color: color, padding: '5px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '900' });

const loaderBox = { padding: '120px 0', textAlign: 'center', color: '#94a3b8', fontWeight: '800' };
const emptyCard = { gridColumn: '1/-1', textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '24px', color: '#cbd5e1', fontWeight: '800', fontSize: '13px' };
const noData = { textAlign: 'center', padding: '35px', color: '#cbd5e1', fontWeight: '800', fontSize: '13px' };

const animations = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .card-hover { transition: all 0.3s ease; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 25px 50px rgba(0,0,0,0.04); }
  .hover-scale:active { transform: scale(0.98); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.4s ease-out; }
  .spinner { width: 28px; height: 28px; border: 3.5px solid #e2e8f0; border-top: 3.5px solid #0f172a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .mobile-header { flex-direction: column; gap: 15px; align-items: flex-start !important; }
    .loan-grid { grid-template-columns: 1fr !important; }
  }
`;

export default EMIPayments;