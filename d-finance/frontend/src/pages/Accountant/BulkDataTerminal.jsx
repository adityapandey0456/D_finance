import React, { useState, useEffect, useCallback } from 'react';
import API from "../../api/axios";
import { 
  FiDatabase, FiSearch, FiRefreshCw, FiArrowLeft, FiFileText, 
  FiUsers, FiChevronDown, FiChevronUp, FiActivity,
  FiClock, FiCheckCircle, FiAlertTriangle, FiCalendar, FiDollarSign, FiInfo, FiUser
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const BulkDataTerminal = () => {
  const [viewMode, setViewMode] = useState('list'); 
  const [data, setData] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); 
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  const [scheduleOverride, setScheduleOverride] = useState({}); 
  const [backdateAmount, setBackdateAmount] = useState({});     
  const [backdateDate, setBackdateDate] = useState({});         

  const navigate = useNavigate();

  const currentUser = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : { fullName: "Master Admin" };
    } catch (e) { return { fullName: "Master Admin" }; }
  })();

  const fetchBulkData = useCallback(async () => {
    try {
      setLoading(true);
      const [resLoans, resCustomers] = await Promise.all([
        API.get('/admin/all-loans').catch(() => ({ data: [] })),
        API.get('/admin/all-customers').catch(() => ({ data: [] }))
      ]);

      const activeLoans = Array.isArray(resLoans?.data) 
        ? resLoans.data.filter(l => l.status !== 'Closed' && l.status !== 'Settled') 
        : [];
        
      setData(activeLoans);
      setAllCustomers(Array.isArray(resCustomers?.data) ? resCustomers.data : []);
    } catch (err) {
      console.error("Master Terminal Sync Exception:", err);
      setData([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { window.scroll(0,0); fetchBulkData(); }, [fetchBulkData]);

  const handleUpdateEMISchedule = async (loanId) => {
    const targetDayOrDate = scheduleOverride[loanId];
    if (!targetDayOrDate) return alert("Please pick a valid Weekday or Calendar target date first.");
    if (!window.confirm(`Override schedule profile parameters for File ID: ${loanId} to "${targetDayOrDate}"?`)) return;

    try {
      setActionLoading(true);
      await API.post('/admin/approve-direct-repayment', {
        loanId: loanId,
        amount: 0,
        remarks: `SCHEDULE MUTATION: Next collection target hard-set to [${targetDayOrDate}] via Terminal Panel.`
      });
      alert(`🎉 Collection routing optimized successfully for ${targetDayOrDate}!`);
      fetchBulkData();
    } catch (err) {
      alert("Failed to override route parameters.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostBackdatedPayment = async (loanId) => {
    const amt = backdateAmount[loanId];
    const pastDate = backdateDate[loanId];

    if (!amt || Number(amt) <= 0 || !pastDate) {
      return alert("Please enter both a valid recovery amount and a historical calendar date.");
    }
    if (!window.confirm(`Verify Manual Backdated Overdue Settlement?\n\nPost payment entry of ₹${Number(amt).toLocaleString()} credited back on date [${pastDate}]?`)) return;

    try {
      setActionLoading(true);
      const response = await API.post('/admin/approve-direct-repayment', {
        loanId: loanId,
        amount: Number(amt),
        remarks: `BACKDATED CASH ENTRY: Amount cleared on historical date [${pastDate}] via Admin Override Terminal.`
      });

      if (response.data.success || response.status === 200) {
        alert("🎉 Historical ledger entry verified & cleared! Overdue balance adjusted.");
        setBackdateAmount(prev => ({ ...prev, [loanId]: '' }));
        setBackdateDate(prev => ({ ...prev, [loanId]: '' }));
        fetchBulkData();
      }
    } catch (err) {
      alert("Backdated ledger mutation handshake failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceCloseLoan = async (loan) => {
    const outstanding = loan.totalPending || 0;
    if (!window.confirm(`⚠️ CRITICAL KILLSWITCH OVERRIDE:\n\nForce close the account ledger for ${loan.customerName?.toUpperCase()}?\n\nThis will write off their remaining pending balance of ₹${outstanding.toLocaleString()} and remove them from active tracking lists.`)) return;
    
    try {
      setActionLoading(true);
      const response = await API.post('/admin/approve-direct-repayment', {
        loanId: loan.loanId,
        amount: outstanding,
        remarks: "CRITICAL COMPLIANCE CLOSE: Ledger liquidated and archived via terminal override killswitch."
      });

      if (response.data.success || response.status === 200) {
        alert("🎯 Account fully liquidated & moved to historical safe storage archives!");
        fetchBulkData();
      }
    } catch (err) {
      alert("Core Terminal Settlement Handshake Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredData = (data || []).filter(item => 
    (item?.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (item?.loanId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (item?.customerMobile || "").includes(searchTerm) ||
    (item?.status?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={loaderStyle}>
       <FiRefreshCw className="animate-spin" size={30} color="#2563eb" />
       <p style={{ fontWeight: '900', color: '#94a3b8', marginTop: '15px' }}>SYNCING MASTER DATA TERMINAL LEDGERS...</p>
    </div>
  );

  return (
    <div style={pageWrapper}>
      <style>{animationCSS}</style>
      
      <div style={header}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <button onClick={() => navigate(-1)} style={iconBtn}><FiArrowLeft /></button>
          <div>
            <h2 style={mainTitle}>Master Data Terminal</h2>
            <p style={subTitle}>Operational Node Identifier: {currentUser?.fullName}</p>
          </div>
        </div>
        
        <div style={{display:'flex', gap:'10px'}}>
           <div style={toggleBox}>
              <button onClick={() => setViewMode('list')} style={{...tglBtn, background: viewMode === 'list' ? '#0f172a' : 'transparent', color: viewMode === 'list' ? '#fff' : '#64748b'}}><FiUsers /> List Index</button>
              <button onClick={() => setViewMode('report')} style={{...tglBtn, background: viewMode === 'report' ? '#0f172a' : 'transparent', color: viewMode === 'report' ? '#fff' : '#64748b'}}><FiFileText /> Master Table</button>
           </div>
           <button onClick={fetchBulkData} disabled={actionLoading} style={refreshBtn}><FiRefreshCw className={actionLoading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      <div style={searchArea}>
         <div style={{flex: 1, display:'flex', alignItems:'center', gap:'12px'}}>
            <FiSearch color="#94a3b8" />
            <input style={searchInput} placeholder="Filter Active Ledger Data by Name, ID, Mobile, Status..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
         </div>
         <div style={insightTag}>
            <b>{filteredData.length}</b> Profiles Monitored
         </div>
      </div>

      <div style={contentGrid}>
        {viewMode === 'list' ? (
          <div style={listStack}>
            {filteredData.map(loan => {
              // 🔥 FRONTEND ROBUST HYBRID LOOKUP ENGINE
              const matchedCustomer = allCustomers.find(c => c._id === loan.customerId?._id || c._id === loan.customerId);

              // Safe attributes resolver variables mapping fallbacks
              const kycNominee = loan.nomineeName || loan.customerId?.nomineeName || matchedCustomer?.nomineeName || 'N/A';
              const kycMobile = loan.customerMobile || loan.customerId?.mobile || matchedCustomer?.mobile || 'N/A';
              const kycEmail = loan.customerId?.email || matchedCustomer?.email || 'N/A';
              const kycAadhaar = loan.customerId?.aadhaar || matchedCustomer?.aadhaar || loan.aadhaar || 'N/A';
              const kycPan = loan.customerId?.pan || matchedCustomer?.pan || 'N/A';
              const kycBank = loan.customerId?.bankName || matchedCustomer?.bankName || loan.bankDetails?.bankName || 'NO RECORD LINK';
              const kycAcc = loan.customerId?.accountNumber || matchedCustomer?.accountNumber || loan.bankDetails?.accountNumber || 'NO RECORD LINK';
              const kycIfsc = loan.customerId?.ifsc || matchedCustomer?.ifsc || loan.bankDetails?.ifsc || 'NO RECORD LINK';

              return (
                <div key={loan?._id || Math.random()} style={dataRow}>
                  <div style={rowMain} onClick={() => setExpandedId(expandedId === loan?._id ? null : loan?._id)}>
                    <div style={rowInfo}>
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                         <span style={idLabel}>{loan?.loanId || 'N/A'}</span>
                         <span style={statusBadge(loan?.status)}>{loan?.status}</span>
                      </div>
                      <h4 style={nameLabel}>{loan?.customerName || 'Unknown'}</h4>
                    </div>
                    <div style={rowStats}>
                       <div style={statUnit}><small>SANCTIONED</small><b>₹{(loan?.amount || 0).toLocaleString('en-IN')}</b></div>
                       <div style={statUnit}><small>OUTSTANDING</small><b style={{color:'#ef4444'}}>₹{(loan?.totalPending || 0).toLocaleString('en-IN')}</b></div>
                       <div style={{color: '#cbd5e1'}}>{expandedId === loan?._id ? <FiChevronUp size={24}/> : <FiChevronDown size={24}/>}</div>
                    </div>
                  </div>

                  {expandedId === loan?._id && (
                    <div className="expand-anim" style={expandedDetails}>
                      
                      {/* PART 1: COMPREHENSIVE CLIENT KYC HUB */}
                      <div style={kycDossierMainBox}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                          <img 
                            src={matchedCustomer?.photo || loan.customerId?.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                            alt="User Profile" 
                            style={avatarFrameStyle} 
                            onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
                          />
                          <div>
                            <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>🔒 Fully Verified Profile Documents</h5>
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>Deep Master File Indexing Linked</span>
                          </div>
                        </div>

                        <div style={kycGridSystem}>
                          <div style={kycField}><span style={kycLabel}>Nominee Link</span><span style={kycValue}>{kycNominee}</span></div>
                          <div style={kycField}><span style={kycLabel}>Mobile Direct</span><span style={kycValue}>{kycMobile}</span></div>
                          <div style={kycField}><span style={kycLabel}>Email Account</span><span style={{ ...kycValue, textTransform: 'none' }}>{kycEmail}</span></div>
                          <div style={kycField}><span style={kycLabel}>Aadhaar Card</span><span style={kycValue}>{kycAadhaar}</span></div>
                          <div style={kycField}><span style={kycLabel}>PAN Card Secure</span><span style={{ ...kycValue, textTransform: 'uppercase' }}>{kycPan}</span></div>
                          <div style={kycField}><span style={kycLabel}>Bank Registry</span><span style={kycValue}>{kycBank}</span></div>
                          <div style={kycField}><span style={kycLabel}>Account Number</span><span style={kycValue}>{kycAcc}</span></div>
                          <div style={kycField}><span style={kycLabel}>IFSC Route Code</span><span style={{ ...kycValue, textTransform: 'uppercase' }}>{kycIfsc}</span></div>
                        </div>
                      </div>

                      {/* PART 2: ADMINISTRATIVE OVERRIDE OPERATIONAL HUBS */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginTop: '20px' }}>
                        
                        <div style={formControlCardBox}>
                          <h5 style={formBlockHeader}><FiCalendar /> Set Next Collection Route</h5>
                          <p style={formDescriptionStyle}>Force update the next target day or select a custom operational route calendar entry parameters.</p>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <select 
                              value={scheduleOverride[loan.loanId] || ''} 
                              onChange={(e) => setScheduleOverride(prev => ({ ...prev, [loan.loanId]: e.target.value }))}
                              style={formInlineSelect}
                            >
                              <option value="">-- Choose Route / Date --</option>
                              <option value="Monday">📅 Every Monday Target</option>
                              <option value="Tuesday">📅 Every Tuesday Target</option>
                              <option value="Wednesday">📅 Every Wednesday Target</option>
                              <option value="Thursday">📅 Every Thursday Target</option>
                              <option value="Friday">📅 Every Friday Target</option>
                              <option value="Saturday">📅 Every Saturday Target</option>
                              <option value="Daily EMI Route">⚡ Daily Dynamic Route</option>
                            </select>
                            <button 
                              onClick={() => handleUpdateEMISchedule(loan.loanId)}
                              disabled={actionLoading}
                              style={formActionSubmitBtn}
                            >
                              Apply Route
                            </button>
                          </div>
                        </div>

                        <div style={formControlCardBox}>
                          <h5 style={formBlockHeader}><FiDollarSign /> Record Backdated Cash Entry</h5>
                          <p style={formDescriptionStyle}>Force patch historical credit data. Select custom collection amount and match old date registry ledger.</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                            <input 
                              type="number" 
                              placeholder={`Amt (Default ₹${loan.installmentAmount})`}
                              value={backdateAmount[loan.loanId] || ''}
                              onChange={(e) => setBackdateAmount(prev => ({ ...prev, [loan.loanId]: e.target.value }))}
                              style={formInlineInput}
                            />
                            <input 
                              type="date" 
                              value={backdateDate[loan.loanId] || ''}
                              onChange={(e) => setBackdateDate(prev => ({ ...prev, [loan.loanId]: e.target.value }))}
                              style={formInlineInput}
                            />
                          </div>
                          <button 
                            onClick={() => handlePostBackdatedPayment(loan.loanId)}
                            disabled={actionLoading}
                            style={{ ...formActionSubmitBtn, width: '100%', marginTop: '8px', background: '#059669' }}
                          >
                            Post Historical Credit Entry
                          </button>
                        </div>

                      </div>

                      <div style={criticalKillSwitchPanel}>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#b91c1c', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FiAlertTriangle /> Critical Ledger Infrastructure Tools
                        </div>
                        <button 
                          onClick={() => handleForceCloseLoan(loan)}
                          disabled={actionLoading}
                          style={masterArchiveKillBtn}
                        >
                          Force Close & Archive Portfolio Statement File
                        </button>
                      </div>

                      {/* PART 3: HISTORICAL DATA TABLE LISTING */}
                      <div style={{ ...detailBox, marginTop: '20px' }}>
                        <p style={boxLabel}><FiActivity /> Registered Repayment History Ledger Logs</p>
                        <div style={historyTableBox}>
                           <table style={table}>
                             <thead><tr style={thRow}><th>Payment Cycle Date</th><th>Settled Volume Amount</th><th>Authentication Status</th></tr></thead>
                             <tbody>
                               {loan?.repaymentHistory?.length > 0 ? (
                                 loan.repaymentHistory.map((p, i) => (
                                   <tr key={i} style={trStyle}>
                                     <td style={tdStyle}>{p?.date ? new Date(p.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                                     <td style={{ ...tdStyle, fontWeight: 'bold', color: '#059669' }}>₹{(p?.amount || 0).toLocaleString('en-IN')}</td>
                                     <td style={tdStyle}><span style={statusBadge(p?.status)}>{p?.status}</span></td>
                                   </tr>
                                 ))
                               ) : <tr><td colSpan="3" style={emptyMsg}>No localized transactional logs detected on this cluster module reference.</td></tr>}
                             </tbody>
                           </table>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={reportTableWrapper} className="custom-scroll">
             <table style={table}>
               <style>{` th { padding: 16px 20px !important; } `}</style>
               <thead style={stickyHead}>
                 <tr style={thRow}>
                   <th>Loan ID</th>
                   <th>Customer Name</th>
                   <th>Principal Amount</th>
                   <th>Accumulated Paid</th>
                   <th>Outstanding Liability</th>
                   <th>System Status</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredData.map((loan, i) => (
                   <tr key={loan?._id || i} style={tableRowStyleHover}>
                     <td style={tdStyle}><span style={idLabel}>{loan?.loanId}</span></td>
                     <td style={tdStyle}><b>{loan?.customerName}</b></td>
                     <td style={tdStyle}>₹{(loan?.amount || 0).toLocaleString('en-IN')}</td>
                     <td style={{...tdStyle, color:'#10b981', fontWeight:800}}>₹{(loan?.totalPaid || 0).toLocaleString('en-IN')}</td>
                     <td style={{...tdStyle, color:'#ef4444', fontWeight:800}}>₹{(loan?.totalPending || 0).toLocaleString('en-IN')}</td>
                     <td style={tdStyle}><span style={statusBadge(loan?.status)}>{loan?.status}</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};

const pageWrapper = { padding: '25px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap:'wrap', gap:'15px' };
const mainTitle = { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' };
const subTitle = { margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' };
const toggleBox = { background: '#fff', padding: '5px', borderRadius: '14px', display: 'flex', border: '1px solid #e2e8f0' };
const tglBtn = { padding: '8px 18px', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px' };
const searchArea = { background: '#fff', padding: '14px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' };
const searchInput = { border: 'none', outline: 'none', width: '100%', fontSize: '13px', fontWeight: '600', color: '#334155' };
const insightTag = { background: '#f1f5f9', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', color: '#475569', fontWeight: 'bold' };
const contentGrid = { display: 'block' }; 
const listStack = { display: 'flex', flexDirection: 'column', gap: '12px' };
const dataRow = { background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const rowMain = { padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' };
const rowInfo = { display: 'flex', flexDirection: 'column', gap: '6px' };
const idLabel = { fontSize: '9px', fontWeight: '900', color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' };
const nameLabel = { margin: 0, fontSize: '15px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' };
const rowStats = { display: 'flex', alignItems: 'center', gap: '35px' };
const statUnit = { display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' };
const expandedDetails = { padding: '25px', background: '#fcfdfe', borderTop: '1px solid #f1f5f9' };
const detailGrid = { display: 'block' };
const detailBox = { display: 'flex', flexDirection: 'column', gap: '12px' };
const boxLabel = { margin: 0, fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'8px' };
const historyTableBox = { background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const table = { width: '100%', borderCollapse: 'collapse' };
const thRow = { textAlign: 'left', background: '#f8fafc', fontSize: '10px', color: '#94a3b8', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontWeight: '900' };
const tdStyle = { padding: '14px 20px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: '#334155' };
const trStyle = { borderBottom: '1px solid #f8fafc' };
const tableRowStyleHover = { borderBottom: '1px solid #f1f5f9' };
const reportTableWrapper = { background: '#fff', borderRadius: '22px', border: '1px solid #e2e8f0', overflowX: 'auto' };
const stickyHead = { position: 'sticky', top: 0, zIndex: 10 };
const iconBtn = { padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const refreshBtn = { padding: '12px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const loaderStyle = { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' };
const emptyMsg = { textAlign: 'center', padding: '30px', color: '#cbd5e1', fontSize: '12px', fontWeight: 'bold' };

const kycDossierMainBox = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '15px' };
const avatarFrameStyle = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const kycGridSystem = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 15px', marginTop: '10px' };
const kycField = { display: 'flex', flexDirection: 'column', background: '#fff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #f1f5f9' };
const kycLabel = { fontSize: '8px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' };
const kycValue = { fontSize: '12px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' };

const formControlCardBox = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '15px' };
const formBlockHeader = { margin: '0 0 4px 0', fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' };
const formDescriptionStyle = { margin: 0, fontSize: '10px', color: '#64748b', lineHeight: '1.4' };
const formInlineSelect = { flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', outline: 'none' };
const formInlineInput = { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' };
const formActionSubmitBtn = { background: '#2563eb', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' };

const criticalKillSwitchPanel = { background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '18px', padding: '12px 15px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' };
const masterArchiveKillBtn = { background: '#dc2626', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' };

const statusBadge = (s) => ({ 
  fontSize: '9px', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase',
  background: s === 'Approved' || s === 'Disbursed' || s === 'Success' ? '#dcfce7' : s === 'Pending' ? '#fef3c7' : '#fee2e2', 
  color: s === 'Approved' || s === 'Disbursed' || s === 'Success' ? '#15803d' : s === 'Pending' ? '#92400e' : '#b91c1c' 
});

const animationCSS = ` 
  .expand-anim { animation: slideDown 0.25s ease-out; } 
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } } 
  small { font-size: 8px; font-weight: 900; color: #94a3b8; display: block; letter-spacing: 0.5px }
  b { font-size: 14px; color: #0f172a; }
`;

export default BulkDataTerminal;