import React, { useState, useEffect, useCallback } from 'react';
import API from "../../../api/axios"; 
import { 
  FiUsers, FiBriefcase, FiUserCheck, FiClock, FiFileText, 
  FiRefreshCw, FiTarget, FiSmartphone, FiShield, FiChevronDown, 
  FiChevronUp, FiTrash2, FiEdit2, FiInfo, FiActivity, FiBriefcase as FiBank 
} from 'react-icons/fi';

const BranchMaster = () => {
  const [activeSection, setActiveSection] = useState('officers');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ users: [], loans: [], payments: [] });
  
  // Nested Accordion Tracking States
  const [expandedOfficer, setExpandedOfficer] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, lRes, pRes] = await Promise.all([
        API.get('/admin/all-users-absolute').catch(() => ({ data: [] })),
        API.get('/admin/all-loans').catch(() => ({ data: [] })),
        API.get('/admin/collection-report').catch(() => ({ data: [] }))
      ]);
      setData({ 
        users: Array.isArray(uRes.data) ? uRes.data : [], 
        loans: Array.isArray(lRes.data) ? lRes.data : [],
        payments: Array.isArray(pRes.data) ? pRes.data : []
      });
    } catch (err) {
      console.error("Database Core Matrix Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMasterData(); }, [fetchMasterData]);

  // --- 🛠️ ADMIN MASTER ACTIONS HANDLERS ---
  const handleUpdateStatus = async (loanId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      const loanItem = data.loans.find(l => l.loanId === loanId);
      if (!loanItem) return alert("Loan file match mismatch!");
      
      const res = await API.post(`/admin/update-loan-status/${loanItem._id}`, { status: newStatus });
      if (res.status === 200 || res.data?.success) {
        alert("🎉 Global Node Status Altered Successfully!");
        fetchMasterData();
      }
    } catch (err) {
      alert("❌ Operation rejected by database ledger context.");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ CRITICAL WARN: Delete account records permanently for ${userName}?`)) return;
    try {
      const res = await API.delete(`/admin/purge-user/${userId}`);
      if (res.data.success) {
        alert("🗑️ User purged from Atlas network database registry.");
        fetchMasterData();
      }
    } catch (err) {
      alert("❌ Action Denied. Active structural dependencies found.");
    }
  };

  // --- 📊 TRANSFORM ENGINE MAPPINGS ---
  const getNameFromId = (id) => {
    const user = data.users.find(u => String(u._id) === String(id));
    return user ? user.fullName : null;
  };

  const fieldOfficers = data.users
    .filter(u => ['User', 'user', 'FieldOfficer', 'fieldofficer'].includes(u.role))
    .map(officer => {
      const linkedLoans = data.loans.filter(loan => 
        String(loan.fieldOfficerId) === String(officer._id) || 
        loan.fieldOfficerName === officer.fullName ||
        loan.verifiedByName === officer.fullName
      );
      return { ...officer, approvals: linkedLoans };
    });

  const customers = data.users
    .filter(u => ['Customer', 'customer'].includes(u.role))
    .map(cust => {
      const loanInfo = data.loans.find(l => String(l.customerId) === String(cust._id));
      const officer = loanInfo?.verifiedByName || getNameFromId(loanInfo?.fieldOfficerId) || "Not Assigned";
      return { 
        ...cust, 
        assignedOfficer: officer, 
        loanDetailsObj: loanInfo,
        loanStatus: loanInfo?.status || "No Active Loan",
        loanId: loanInfo?.loanId
      };
    });

  const accountants = data.users
    .filter(u => ['Accountant', 'accountant'].includes(u.role))
    .map(acc => {
      // Find historical payment entry approvals processed by this node name
      const audits = data.payments.filter(p => p.approvedBy === acc.fullName || p.processedBy === acc._id);
      return { ...acc, workLogs: audits };
    });

  if (loading) return (
    <div style={loaderContainer}>
      <FiRefreshCw className="spin" size={35} color="#2563eb" />
      <p style={{fontWeight: 900, marginTop: '15px', letterSpacing: '2px', color: '#1e293b'}}>DECRYPTING BRANCH LEDGER MATRIX...</p>
    </div>
  );

  return (
    <div style={{ padding: '25px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; } .custom-select { padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-weight: 800; font-size: 11px; background: #fff; cursor: pointer; color: #1e293b; outline: none; }`}</style>

      {/* --- HUD HEADER --- */}
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '26px', tracking: '-1px' }}>🏢 OPERATIONS CONTROL TOWER</h2>
          <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginTop: '4px', tracking: '1px' }}>Mathura Hub • Admin Infrastructure Management</p>
        </div>
        <button onClick={fetchMasterData} style={refreshBtn}><FiRefreshCw /> LIVE RE-SYNC</button>
      </div>

      {/* --- DASHBOARD VIEW SECTOR SWITCH TABS --- */}
      <div style={tabContainer}>
        <button onClick={() => setActiveSection('officers')} style={activeSection === 'officers' ? activeTab : tabBtn}><FiUserCheck /> Officers Matrix ({fieldOfficers.length})</button>
        <button onClick={() => setActiveSection('accountants')} style={activeSection === 'accountants' ? activeTab : tabBtn}><FiShield /> Accountants Hub ({accountants.length})</button>
        <button onClick={() => setActiveSection('customers')} style={activeSection === 'customers' ? activeTab : tabBtn}><FiUsers /> Client Repositories ({customers.length})</button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: FIELD OFFICERS (WITH 3-LEVEL NESTED DETAILS ACCORDIONS) */}
      {/* ========================================================================= */}
      {activeSection === 'officers' && (
        <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          {fieldOfficers.map(officer => {
            const isOfficerOpen = expandedOfficer === officer._id;
            return (
              <div key={officer._id} style={{background:'#fff', borderRadius:'24px', border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 4px 6px rgba(0,0,0,0.01)'}}>
                {/* Level 1 Title: Officer Base Credentials */}
                <div onClick={() => setExpandedOfficer(isOfficerOpen ? null : officer._id)} style={{padding:'20px 25px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', background: isOfficerOpen ? '#f8fafc' : '#fff'}}>
                  <div>
                    <h3 style={{margin:0, fontSize:'16px', fontWeight:900, color:'#0f172a'}}>{officer.fullName}</h3>
                    <small style={{color:'#64748b', fontSize:'11px', fontStyle:'monospace'}}>Agent Tel: {officer.mobile || 'N/A'}</small>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <span style={countBadge}>{officer.approvals.length} Pipeline Leads</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(officer._id, officer.fullName); }} style={actionTrashBtn} title="Purge Officer Account"><FiTrash2 /></button>
                    {isOfficerOpen ? <FiChevronUp/> : <FiChevronDown/>}
                  </div>
                </div>

                {/* Level 2 Area: Customer Files Nesting Container */}
                {isOfficerOpen && (
                  <div style={{padding:'20px', background:'#fcfdfe', borderTop:'1px solid #f1f5f9', display:'flex', flexDirection:'column', gap:'12px'}}>
                    <span style={{fontSize:'10px', fontWeight:950, color:'#94a3b8', tracking:'1px'}}><FiActivity /> ASSIGNED PIPELINE PORTFOLIO REGISTRY</span>
                    
                    {officer.approvals.length > 0 ? officer.approvals.map((loan, idx) => {
                      const isCustOpen = expandedCustomer === loan._id;
                      return (
                        <div key={idx} style={{border:'1px solid #e2e8f0', borderRadius:'16px', background:'#fff', overflow:'hidden'}}>
                          {/* Inner Customer Header Row */}
                          <div onClick={() => setExpandedCustomer(isCustOpen ? null : loan._id)} style={{padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', background: isCustOpen ? '#f1f5f9' : '#fff'}}>
                            <div>
                              <b style={{fontSize:'13px', color:'#1e293b'}}>{loan.customerName}</b>
                              <span style={{...loanIdTag, marginLeft:'10px'}}>{loan.loanId}</span>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                              <span style={{fontSize:'12px', fontWeight:900, color:'#0f172a'}}>₹{loan.amount}</span>
                              <span style={statusTagStatic(loan.status)}>{loan.status}</span>
                              {isCustOpen ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                            </div>
                          </div>

                          {/* Level 3: Deep Technical Ledger Specification Cards */}
                          {isCustOpen && (
                            <div style={{padding:'20px', background:'#fdfefe', borderTop:'1px solid #e2e8f0', fontSize:'12px'}}>
                              <div style={nestedDetailsGrid}>
                                <div style={detailsBox}>
                                  <h5 style={boxTitleLabel}><FiBank /> Settlements Destination Bank</h5>
                                  <p>Account Holder: <b>{loan.accountHolderName || 'N/A'}</b></p>
                                  <p>Bank Context: <b>{loan.bankName || 'N/A'} ({loan.branchName || 'N/A'})</b></p>
                                  <p>Account Registry Number: <code style={codePillStyle}>{loan.accountNumber || 'N/A'}</code></p>
                                  <p>IFSC Gateway Token: <code style={codePillStyle}>{loan.ifscCode || 'N/A'}</code></p>
                                </div>
                                <div style={detailsBox}>
                                  <h5 style={boxTitleLabel}><FiInfo /> Repayments Financial Ledger Math</h5>
                                  <p>Total Net Disbursement: <b style={{color:'#10b981'}}>₹{loan.netDisbursed || 0}</b></p>
                                  <p>Total Return Payable: <b>₹{loan.totalPayable || 0}</b></p>
                                  <p>Active Installment Weight: <b>₹{loan.installmentAmount} ({loan.emiType})</b></p>
                                  <p>Outstanding System Debt: <b style={{color:'#ef4444'}}>₹{loan.totalPending || 0}</b></p>
                                </div>
                              </div>
                              {/* Direct Admin Workflow Controls within Accordion */}
                              <div style={inlineControlPanelBar}>
                                <span>⚡ Immediate Override State Manager:</span>
                                <select className="custom-select" value={loan.status} onChange={(e) => handleUpdateStatus(loan.loanId, e.target.value)}>
                                  {['Verification Pending', 'Field Verified', 'Approved', 'Disbursed', 'Rejected', 'Closed'].map(st => (
                                    <option key={st} value={st}>{st.toUpperCase()}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }) : <p style={emptyText}>No customer sheets bound to this officer node registry.</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ACCOUNTANTS OPERATIONAL LOG RUNS */}
      {/* ========================================================================= */}
      {activeSection === 'accountants' && (
        <div style={tableCard}>
          <div style={{overflowX:'auto'}}>
            <table style={fullTable}>
              <thead>
                <tr style={tableHead}>
                  <th style={{padding: '20px'}}>Accountant Master Node</th>
                  <th>Contact String</th>
                  <th>Atlas Account ID</th>
                  <th>System Actions Performance Audit</th>
                  <th>Status Registry</th>
                </tr>
              </thead>
              <tbody>
                {accountants.map(acc => (
                  <tr key={acc._id} style={tableRow}>
                    <td style={{ fontWeight: 900, padding: '20px', color:'#0f172a' }}>{acc.fullName}</td>
                    <td style={{ fontWeight: 'bold', color: '#64748b' }}><FiSmartphone/> {acc.mobile}</td>
                    <td style={{ fontSize: '11px', color: '#94a3b8', fontFamily:'monospace' }}>{acc._id}</td>
                    <td>
                      <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                        <span style={{background:'#eff6ff', color:'#2563eb', padding:'3px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:900}}>📝 Receipts Audited: {acc.workLogs?.length || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <span style={roleTag}>AUTHORIZED_GATEWAY</span>
                        <button onClick={() => handleDeleteUser(acc._id, acc.fullName)} style={actionTrashBtn} title="Purge Accountant Account"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {accountants.length === 0 && <tr><td colSpan="5" style={emptyText}>No registered accountant nodes detected in the local collection schema.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ABSOLUTE CUSTOMERS COMPLETE SPECIFICATION INDEX */}
      {/* ========================================================================= */}
      {activeSection === 'customers' && (
        <div style={tableCard}>
          <div style={{overflowX:'auto'}}>
            <table style={fullTable}>
              <thead>
                <tr style={tableHead}>
                  <th style={{padding: '20px'}}>Client Profiles Name</th>
                  <th>Primary Mobile</th>
                  <th>Linked Operations Executive Node</th>
                  <th>System State Pipeline Override</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(cust => (
                  <tr key={cust._id} style={tableRow}>
                    <td style={{ padding: '20px' }}>
                      <p style={{ margin: 0, fontWeight: 900, color:'#0f172a' }}>{cust.fullName}</p>
                      <small style={{ color: '#94a3b8', fontStyle:'monospace', fontWeight:'bold' }}>FILE ID: {cust.loanId || 'UNBOUND NEW SPEC'}</small>
                    </td>
                    <td style={{fontWeight: 'bold', color: '#64748b'}}>{cust.mobile || 'Missing Phone'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: cust.assignedOfficer === 'Not Assigned' ? '#ef4444' : '#2563eb', fontWeight: '900', fontSize: '12px' }}>
                        <FiTarget size={13} /> {cust.assignedOfficer}
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:'15px'}} onClick={(e)=>e.stopPropagation()}>
                        {cust.loanId ? (
                          <select className="custom-select" value={cust.loanStatus} onChange={(e) => handleUpdateStatus(cust.loanId, e.target.value)}>
                            {['Verification Pending', 'Field Verified', 'Approved', 'Disbursed', 'Rejected', 'Closed', 'No Active Loan'].map(st => (
                              <option key={st} value={st}>{st.toUpperCase()}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={statusTagStatic('No Active Loan')}>NO LIVE PORTFOLIO</span>
                        )}
                        <button onClick={() => handleDeleteUser(cust._id, cust.fullName)} style={actionTrashBtn} title="Purge Customer Complete Profile"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CORE DESIGN INLINE STYLES SHEET MATRIX ---
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' };
const refreshBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', fontSize: '12px', tracking: '0.5px' };
const tabContainer = { display: 'flex', gap: '10px', marginBottom: '30px', background: '#fff', padding: '6px', borderRadius: '18px', width: 'fit-content', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', border: '1px solid #e2e8f0', overflowX: 'auto', maxWidth: '100%' };
const tabBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', border: 'none', background: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', color: '#94a3b8', fontSize: '12px', transition: '0.2s', whiteSpace: 'nowrap' };
const activeTab = { ...tabBtn, background: '#2563eb', color: '#fff' };

const countBadge = { background: '#eff6ff', color: '#2563eb', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', border: '1px solid #dbeafe' };
const loanIdTag = { fontSize: '10px', color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', fontStyle: 'monospace' };
const tableCard = { background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', border: '1px solid #e2e8f0' };
const fullTable = { width: '100%', borderCollapse: 'collapse', textTransform: 'none' };
const tableHead = { background: '#f8fafc', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', borderBottom: '1px solid #e2e8f0' };
const tableRow = { borderBottom: '1px solid #f1f5f9', fontSize: '13px', hover: { background: '#fafbfc' } };
const roleTag = { padding: '5px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', fontSize: '9px', fontWeight: '900', tracking: '0.5px' };

const actionTrashBtn = { background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', activeScale: '0.95' };

// Accordion Nested Specifications Layout Overrides
const nestedDetailsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', padding: '5px 0' };
const detailsBox = { background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', lineHeigth: '1.8' };
const boxTitleLabel = { margin: '0 0 12px 0', fontSize: '11px', fontWeight: '950', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', textTransform: 'uppercase', tracking: '0.5px' };
const codePillStyle = { background: '#fff', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: 'bold', color: '#0f172a', fontStyle: 'normal', fontFamily: 'monospace' };
const inlineControlPanelBar = { marginTop: '15px', padding: '12px 16px', background: '#fff8f2', border: '1px solid #ffeada', borderRadius: '12px', display: 'flex', justifyContext: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '11px', fontWeight: '900', color: '#c2410c', textTransform: 'uppercase' };

const statusTagStatic = (s) => ({
  padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase',
  background: s?.includes('Disbursed') || s?.includes('Approved') ? '#dcfce7' : s?.includes('Verified') ? '#dbeafe' : '#fee2e2',
  color: s?.includes('Disbursed') || s?.includes('Approved') ? '#15803d' : s?.includes('Verified') ? '#1d4ed8' : '#b91c1c'
});

const loaderContainer = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const emptyText = { textAlign: 'center', padding: '25px', color: '#94a3b8', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', tracking: '1px' };

export default BranchMaster;