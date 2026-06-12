import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import PaymentModal from '../Payment/PaymentModal'; 
import { 
  FiSearch, FiClock, FiCheckCircle, FiXCircle, 
  FiShield, FiArrowRight, FiList, FiMaximize, 
  FiActivity, FiPieChart, FiTrendingUp, FiX, FiCheck, FiAlertCircle
} from 'react-icons/fi';

const LoanTracking = () => {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLedger, setSelectedLedger] = useState(null); 
  const [paymentTarget, setPaymentTarget] = useState(null); 
  
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const fetchLoans = useCallback(async () => {
    if (!user.id && !user._id) return;
    try {
      const response = await API.get(`/loans?customerId=${user.id || user._id}`);
      setLoans(response.data.reverse());
    } catch (error) {
      console.error("Tracking Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id, user._id]);

  useEffect(() => {
    fetchLoans();
    const interval = setInterval(fetchLoans, 20000);
    return () => clearInterval(interval);
  }, [fetchLoans]);

  const filteredLoans = loans.filter(loan => 
    (loan.loanId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- CRM GLOBAL STATS CALCULATOR ---
  const globalStats = loans.reduce((acc, loan) => {
    acc.totalPrincipal += Number(loan.amount || 0);
    acc.totalPaid += Number(loan.totalPaid || 0);
    acc.totalPending += Number(loan.totalPending || 0);
    if(loan.status === 'Disbursed') acc.activeLoans += 1;
    return acc;
  }, { totalPrincipal: 0, totalPaid: 0, totalPending: 0, activeLoans: 0 });

  const getStatusStyle = (status) => {
    const styles = {
      Disbursed: { bg: '#dcfce7', text: '#166534', icon: <FiCheckCircle />, label: 'Active Loan' },
      Rejected: { bg: '#fee2e2', text: '#991b1b', icon: <FiXCircle />, label: 'Rejected' },
      'Field Verified': { bg: '#e0f2fe', text: '#0369a1', icon: <FiShield />, label: 'LUC Verified' },
      Approved: { bg: '#f0f9ff', text: '#0284c7', icon: <FiCheckCircle />, label: 'Ready' },
      default: { bg: '#fef3c7', text: '#92400e', icon: <FiClock />, label: 'Pending' }
    };
    return styles[status] || styles.default;
  };

  // --- 🔥 SMART EMI SCHEDULE ENGINE ---
  const generateEMISchedule = (loan) => {
    const schedule = [];
    const totalInst = Number(loan.totalInstallments) || 1;
    const emiVal = Number(loan.installmentAmount || loan.dailyEMI || 0);
    const totalPaid = Number(loan.totalPaid || 0);
    const fullyPaidCount = Math.floor(totalPaid / emiVal); // Calculates exactly how many are paid
    
    for (let i = 1; i <= totalInst; i++) {
      const isSettled = i <= fullyPaidCount;
      const isNextDue = i === fullyPaidCount + 1 && loan.status === 'Disbursed'; // Highlights immediate next
      
      let emiDateObj = new Date(loan.appliedDate?.$date || loan.appliedDate || loan.createdAt || Date.now());
      if (isNaN(emiDateObj.getTime())) emiDateObj = new Date();

      if (loan.emiType === 'Weekly EMI') {
        emiDateObj.setDate(emiDateObj.getDate() + (i * 7));
      } else {
        emiDateObj.setDate(emiDateObj.getDate() + i);
      }

      schedule.push({
        index: i,
        date: emiDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: emiVal,
        status: isSettled ? 'PAID' : 'DUE',
        isNextDue
      });
    }
    return schedule;
  };

  return (
    <div style={containerStyle}>
      <style>{responsiveStyles}</style>
      
      {/* --- PAGE HEADER --- */}
      <div style={headerSection} className="header-flex">
        <div>
          <h2 style={mainTitle}>👋 Welcome back, {user.fullName?.split(' ')[0] || 'User'}!</h2>
          <p style={subTitleText}>Here is the complete financial intelligence of your active credits.</p>
        </div>
        <div style={searchWrapper} className="search-full">
          <FiSearch style={searchIcon} />
          <input type="text" placeholder="Find by Loan ID..." style={searchBar} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* --- GLOBAL CRM DASHBOARD STATS WIDGET --- */}
      {!loading && loans.length > 0 && (
        <div style={crmStatsGrid}>
           <div style={{...crmStatBox, borderBottom: '4px solid #3b82f6'}}>
              <div style={crmIconBox('#eff6ff', '#3b82f6')}><FiActivity size={20}/></div>
              <div>
                <p style={crmStatLabel}>Total Sanctioned</p>
                <h3 style={crmStatValue}>₹{globalStats.totalPrincipal.toLocaleString('en-IN')}</h3>
              </div>
           </div>
           <div style={{...crmStatBox, borderBottom: '4px solid #10b981'}}>
              <div style={crmIconBox('#ecfdf5', '#10b981')}><FiTrendingUp size={20}/></div>
              <div>
                <p style={crmStatLabel}>Total Repaid</p>
                <h3 style={crmStatValue}>₹{globalStats.totalPaid.toLocaleString('en-IN')}</h3>
              </div>
           </div>
           <div style={{...crmStatBox, borderBottom: '4px solid #f43f5e'}}>
              <div style={crmIconBox('#fff1f2', '#f43f5e')}><FiPieChart size={20}/></div>
              <div>
                <p style={crmStatLabel}>Total Outstanding</p>
                <h3 style={crmStatValue}>₹{globalStats.totalPending.toLocaleString('en-IN')}</h3>
              </div>
           </div>
        </div>
      )}

      {/* --- LOANS GRID --- */}
      {loading ? (
        <div style={loaderBox}>🔄 FETCHING CLOUD LEDGER...</div>
      ) : filteredLoans.length === 0 ? (
        <div style={emptyState}>No Loan Records Found in your profile.</div>
      ) : (
        <div className="loan-grid">
          {filteredLoans.map((loan) => {
            const style = getStatusStyle(loan.status);
            const totalEmiAmt = Number(loan.installmentAmount || loan.dailyEMI || 0);
            const emiPaidCount = totalEmiAmt > 0 ? Math.floor(Number(loan.totalPaid || 0) / totalEmiAmt) : 0;
            const totalInstallments = Number(loan.totalInstallments || 0);
            const progressPercent = totalInstallments > 0 ? (emiPaidCount / totalInstallments) * 100 : 0;

            return (
              <div key={loan._id} style={loanCard} className="card-hover">
                <div style={cardHeader}>
                  <span style={loanIdTag}>LID: {loan.loanId}</span>
                  <span style={{ ...statusBadge, background: style.bg, color: style.text }}>
                    {style.icon} <span className="status-label">{style.label}</span>
                  </span>
                </div>
                
                <div style={cardBody} className="body-stack">
                   <div>
                      <label style={infoLabel}>PRINCIPAL SANCTIONED</label>
                      <h2 style={amountText}>₹{Number(loan.amount || 0).toLocaleString('en-IN')}</h2>
                   </div>
                   <div style={{textAlign: 'right'}} className="emi-align">
                      <label style={{...infoLabel, color: '#2563eb'}}>{loan.emiType?.toUpperCase()} AMT</label>
                      <h3 style={emiText}>₹{totalEmiAmt.toLocaleString('en-IN')}</h3>
                   </div>
                </div>

                {/* Rich Progress Bar */}
                <div style={{marginBottom: '15px'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                      <span style={{fontSize: '10px', fontWeight: '900', color: '#64748b'}}>RECOVERY PROGRESS</span>
                      <span style={{fontSize: '10px', fontWeight: '900', color: '#10b981'}}>{emiPaidCount} / {totalInstallments} Paid</span>
                   </div>
                   <div style={progressBarContainer}>
                      <div style={{...progressBarFill, width: `${progressPercent}%`}}></div>
                   </div>
                </div>

                <div style={detailsGrid}>
                  <div style={infoGroup}>
                    <label style={infoLabel}>PAID VOLUME</label>
                    <span style={{...infoValue, color: '#10b981'}}>₹{Number(loan.totalPaid || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={infoGroup}>
                    <label style={infoLabel}>PENDING DUES</label>
                    <span style={{...infoValue, color: '#f43f5e'}}>₹{Number(loan.totalPending || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div style={cardFooter}>
                  <button style={detailBtn} onClick={() => setSelectedLedger(loan)}>
                    <FiList /> View Full Ledger & Pay EMIs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- 📊 RICH EMI LEDGER MODAL --- */}
      {selectedLedger && (
        <div style={modalOverlay}>
          <div style={modalContent} className="modal-resp">
            
            <div style={modalHeader}>
              <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', fontSize: '16px'}}>
                <FiMaximize /> File: {selectedLedger.loanId}
              </h3>
              <FiX onClick={() => setSelectedLedger(null)} style={{cursor:'pointer', background: 'rgba(255,255,255,0.1)', padding: '5px', borderRadius: '50%'}} size={28} />
            </div>

            <div style={modalBody}>
              {/* Foreclosure / Full Pay Card */}
              {Number(selectedLedger.totalPending || 0) > 0 && selectedLedger.status === 'Disbursed' && (
                <div style={bulkPayCard}>
                  <div>
                      <p style={{fontSize: '11px', fontWeight: '950', color: '#1e3a8a', margin: '0 0 4px 0'}}>CLOSE LOAN ACCOUNT?</p>
                      <p style={{fontSize: '10px', color: '#3b82f6', margin: 0, fontWeight: '600'}}>Clear all remaining dues in one single transaction.</p>
                  </div>
                  <button style={fullPayBtn} onClick={() => setPaymentTarget({ ...selectedLedger, customAmount: selectedLedger.totalPending })}>
                      Foreclose ₹{Number(selectedLedger.totalPending).toLocaleString('en-IN')}
                  </button>
                </div>
              )}

              <h4 style={sectionTitle}>
                <FiClock /> Detailed EMI Schedule 
                <span style={{fontSize: '9px', background: '#e2e8f0', padding: '3px 8px', borderRadius: '10px', color: '#475569', marginLeft: 'auto'}}>
                  Total EMIs: {selectedLedger.totalInstallments}
                </span>
              </h4>
              
              <div style={ledgerScroll}>
                {generateEMISchedule(selectedLedger).map((emi) => (
                  <div key={emi.index} style={{
                    ...emiRow, 
                    border: emi.isNextDue ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: emi.isNextDue ? '#eff6ff' : '#fff'
                  }}>
                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                      <span style={{...emiIndex, background: emi.status === 'PAID' ? '#10b981' : emi.isNextDue ? '#3b82f6' : '#0f172a'}}>
                        {emi.status === 'PAID' ? <FiCheck size={14} /> : emi.index}
                      </span>
                      <div>
                        <div style={infoValue}>{emi.date}</div>
                        <div style={{fontSize:'10px', color: emi.isNextDue ? '#3b82f6' : '#94a3b8', fontWeight: 'bold'}}>
                          {emi.isNextDue ? '🌟 IMMEDIATE DUE' : `Installment ${emi.index}`}
                        </div>
                      </div>
                    </div>

                    {/* 🔥 THE MAGIC: SIDE PAYMENT BUTTON FOR INDIVIDUAL EMIs */}
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:'950', color:'#0f172a', fontSize: '15px'}}>₹{Number(emi.amount).toLocaleString('en-IN')}</div>
                        {emi.status === 'PAID' && (
                           <span style={{fontSize:'9px', fontWeight:'900', color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px'}}>
                             COMPLETED
                           </span>
                        )}
                      </div>
                      
                      {/* Pay Button visible only if not paid and loan is disbursed */}
                      {emi.status === 'DUE' && selectedLedger.status === 'Disbursed' && (
                        <button 
                          onClick={() => setPaymentTarget({ ...selectedLedger, customAmount: emi.amount })}
                          style={{...payMiniBtn, background: emi.isNextDue ? '#2563eb' : '#0f172a'}}
                        >
                          Pay EMI <FiArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {selectedLedger.status !== 'Disbursed' && (
                   <div style={{textAlign: 'center', padding: '15px', color: '#f59e0b', background: '#fffbeb', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold'}}>
                      <FiAlertCircle style={{marginRight: '5px'}}/> Payment portal activates once loan status changes to Disbursed.
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 💰 SECURE PAYMENT MODAL --- */}
      {paymentTarget && (
        <PaymentModal 
          loan={paymentTarget} 
          customAmount={paymentTarget.customAmount} 
          onClose={() => setPaymentTarget(null)} 
          onRefresh={() => {
            fetchLoans();
            setSelectedLedger(null); // Auto close ledger to see updated stats
          }} 
        />
      )}
    </div>
  );
};

// --- STYLES ---
const containerStyle = { padding: '25px 4%', background: '#f1f5f9', minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif' };
const headerSection = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' };
const mainTitle = { margin: 0, fontWeight: 950, fontSize: '28px', color: '#0f172a', letterSpacing: '-1px' };
const subTitleText = { color: '#64748b', fontSize: '14px', marginTop: '6px', fontWeight: '600' };
const searchWrapper = { position: 'relative', display: 'flex', alignItems: 'center' };
const searchIcon = { position: 'absolute', left: '15px', color: '#94a3b8', fontSize: '16px' };
const searchBar = { padding: '14px 15px 14px 45px', borderRadius: '14px', border: '2px solid #e2e8f0', width: '280px', outline: 'none', fontSize: '14px', background: '#fff', fontWeight: 'bold', color: '#0f172a', transition: '0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' };

// Global Stats CRM UI
const crmStatsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '35px' };
const crmStatBox = { background: '#fff', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' };
const crmIconBox = (bg, color) => ({ width: '50px', height: '50px', background: bg, color: color, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const crmStatLabel = { margin: '0 0 4px 0', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' };
const crmStatValue = { margin: 0, fontSize: '22px', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.5px' };

const loanCard = { background: '#fff', borderRadius: '28px', padding: '25px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const loanIdTag = { fontSize: '10px', fontWeight: '900', color: '#475569', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', letterSpacing: '0.5px' };
const statusBadge = { padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' };

const cardBody = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '18px', borderRadius: '20px', marginBottom: '15px', border: '1px solid #f1f5f9' };
const amountText = { margin: 0, color: '#0f172a', fontWeight: '950', fontSize: '24px', letterSpacing: '-0.5px' };
const emiText = { margin: 0, color: '#2563eb', fontWeight: '950', fontSize: '20px' };
const infoLabel = { fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', display: 'block' };

const detailsGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' };
const infoGroup = { display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #f1f5f9' };
const infoValue = { fontSize: '15px', fontWeight: '900', color: '#1e293b' };

const progressBarContainer = { width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' };
const progressBarFill = { height: '100%', background: 'linear-gradient(90deg, #34d399, #10b981)', transition: 'width 0.5s ease' };

const cardFooter = { display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' };
const detailBtn = { flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '13px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', boxShadow: '0 8px 15px rgba(15,23,42,0.15)' };

// --- MODAL STYLES ---
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '20px' };
const modalContent = { background: '#f8fafc', borderRadius: '35px', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflow: 'hidden', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' };
const modalHeader = { background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalBody = { padding: '25px', overflowY: 'auto', flex: 1 };

const bulkPayCard = { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', padding: '25px', borderRadius: '24px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px', boxShadow: '0 10px 25px rgba(37,99,235,0.05)' };
const fullPayBtn = { padding: '14px 24px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '950', fontSize: '13px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(29,78,216,0.3)', whiteSpace: 'nowrap' };

const sectionTitle = { fontSize: '13px', fontWeight: '950', color: '#0f172a', textTransform: 'uppercase', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' };
const ledgerScroll = { display: 'flex', flexDirection: 'column', gap: '12px' };
const emiRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 18px', borderRadius: '20px', transition: '0.2s' };
const emiIndex = { width: '34px', height: '34px', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '950', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };

const payMiniBtn = { color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: '0.2s' };

const loaderBox = { textAlign: 'center', padding: '80px', color: '#94a3b8', fontWeight: '900', fontSize: '15px', letterSpacing: '1px' };
const emptyState = { textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '30px', border: '2px dashed #cbd5e1', color: '#94a3b8', fontWeight: '800', fontSize: '14px' };

const responsiveStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');
  .loan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 25px; }
  @media (max-width: 768px) {
    .header-flex { flex-direction: column; align-items: flex-start !important; gap: 15px; }
    .search-full { width: 100%; }
    .search-full input { width: 100% !important; }
    .status-label { display: none; }
    .body-stack { flex-direction: column; align-items: flex-start !important; gap: 10px; }
    .emi-align { text-align: left !important; }
    .modal-resp { width: 95% !important; height: 85vh !important; }
  }
  .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(15,23,42,0.06); transition: 0.3s; border-color: #cbd5e1; }
  button:active { transform: scale(0.96); }
`;

export default LoanTracking;