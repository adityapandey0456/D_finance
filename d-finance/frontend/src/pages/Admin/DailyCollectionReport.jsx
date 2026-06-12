import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { FiCalendar, FiPrinter, FiDollarSign, FiUsers, FiActivity, FiRefreshCw, FiUser, FiInfo, FiCreditCard } from 'react-icons/fi';

const DailyCollectionReport = () => {
  const [collections, setCollections] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); // 🔥 HYBRID LOOKUP REGISTRY
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  
  // PRINT TARGET MATRIX STATES
  const [printTarget, setPrintTarget] = useState('ALL'); 
  const [selectedProfileId, setSelectedProfileId] = useState(''); 

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [resReport, resLoans, resCustomers] = await Promise.all([
        API.get('/admin/collection-report').catch(() => ({ data: [] })),
        API.get('/admin/all-loans').catch(() => ({ data: [] })),
        API.get('/admin/all-customers').catch(() => ({ data: [] })) // 🔥 Master fetch for bulletproof profile mapping
      ]);

      const reportData = Array.isArray(resReport.data) ? resReport.data : [];
      const loansData = Array.isArray(resLoans.data) ? resLoans.data : [];
      const customersData = Array.isArray(resCustomers.data) ? resCustomers.data : [];

      setCollections(reportData);
      setAllLoans(loansData);
      setAllCustomers(customersData);

      const total = reportData.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      setTotalToday(total);
    } catch (err) {
      console.error("Collection Ledger Master Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Find target loan record
  const selectedLoanRecord = allLoans.find(l => l.loanId === selectedProfileId);

  // 🔥 DETECT TRUE MASTER PROFILE VIA FRONTEND LOOKUP ENGINE
  const coreCustomerProfile = allCustomers.find(c => 
    c._id === selectedLoanRecord?.customerId?._id || 
    c._id === selectedLoanRecord?.customerId
  );

  // 🔥 SMART UTR METHOD DETECTOR ENGINE (Fixes the Manual method bug)
  const detectPaymentMethod = (utrString) => {
    if (!utrString) return "OFFLINE (Cash)";
    const utr = String(utrString).trim();
    
    if (utr.startsWith("PAY-") || utr.startsWith("cf_") || /^\d{10,15}$/.test(utr)) {
      return "ONLINE (Cashfree)";
    }
    if (utr.includes("Manual") || utr.includes("CASH") || utr.includes("WEEK_TODO")) {
      return "OFFLINE (Manual)";
    }
    return "OFFLINE (Manual)";
  };

  // Handshake print execution router
  const handlePrintAction = (targetMode) => {
    setPrintTarget(targetMode);
    setTimeout(() => {
      window.print();
      setPrintTarget('ALL'); 
    }, 150);
  };

  if (loading) return <div style={loaderStyle}>SYSTEM HARDWARE RESYNCING LEDGERS...</div>;

  const printStyles = `
    @media print {
      body, html {
        background: #ffffff !important;
        color: #000000 !important;
        font-size: 11px !important;
      }
      .no-print {
        display: none !important;
      }
      .print-dossier {
        display: block !important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 10mm 12mm 10mm;
      }
      ${printTarget !== 'ALL' ? `
        .print-all-only { display: none !important; }
        .dossier-card { display: none !important; }
        .dossier-card-${printTarget} { 
          display: block !important; 
          border: none !important; 
          padding: 0 !important; 
          margin-top: 10px !important;
        }
      ` : ''}
    }
  `;

  return (
    <div style={{ padding: '15px sm:30px', background: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <style>{printStyles}</style>

      {/* =========================================================================
          1️⃣ ACTIONS HEADER BAR (Screen Only)
         ========================================================================= */}
      <div className="no-print" style={headerStyle}>
        <div>
          <h2 style={{ color: '#0f172a', margin: 0, fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>
            📊 D-Finance Audit Station
          </h2>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>
            Mathura Cluster Hub | Real-time Core Database Integration Panel
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchReportData} style={refreshBtn}>
            <FiRefreshCw /> Resync Data
          </button>
          <button onClick={() => handlePrintAction('ALL')} style={printSummaryBtn}>
            <FiPrinter /> Print Full Audit Sheets
          </button>
        </div>
      </div>

      {/* =========================================================================
          2️⃣ DUAL LAYOUT GRID FRAMEWORK PANEL (Split Layout)
         ========================================================================= */}
      <div className="no-print" style={mainSplitGrid}>
        
        {/* LEFT MAIN SIDE: LEDGER STREAM TABLES */}
        <div style={leftSplitColumn}>
          <div style={statsGrid}>
            <div style={{ ...statCard, borderLeft: '8px solid #059669' }}>
              <label style={labelStyle}>Today's Gross Cash-In</label>
              <h2 style={{ ...valStyle, color: '#059669' }}>₹{totalToday.toLocaleString('en-IN')}</h2>
            </div>
            <div style={{ ...statCard, borderLeft: '8px solid #2563eb' }}>
              <label style={labelStyle}>Active Repayment Nodes</label>
              <h2 style={{ ...valStyle, color: '#2563eb' }}>{collections.length} Logs</h2>
            </div>
          </div>

          <div style={tableCard}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiActivity className="text-blue-600" />
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' }}>Live Collection Entry Streams</h3>
            </div>
            
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeader}>
                  <th style={{ padding: '12px' }}>TIME</th>
                  <th style={{ padding: '12px' }}>LOAN ID</th>
                  <th style={{ padding: '12px' }}>CUSTOMER NAME</th>
                  <th style={{ padding: '12px' }}>AMOUNT</th>
                  <th style={{ padding: '12px' }}>METHOD</th>
                </tr>
              </thead>
              <tbody>
                {collections.length > 0 ? collections.map((pay, i) => (
                  <tr key={pay._id || i} style={tableRow}>
                    <td style={{ padding: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
                      {new Date(pay.paymentDate || pay.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px' }}><span style={idTag}>{pay.loanId}</span></td>
                    <td style={{ padding: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{pay.customerName}</td>
                    <td style={{ padding: '12px', fontWeight: '900', color: '#059669' }}>₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px' }}>
                      {/* 🔥 Dynamic Scanner Engine used here */}
                      <span style={methodTag(detectPaymentMethod(pay.utr))}>
                        {detectPaymentMethod(pay.utr)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={emptyText}>No live collection entries detected in this block.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 👤 RIGHT SIDE PANEL: SINGLE PROFILE PROFILER HUD */}
        <div style={rightSplitColumn}>
          <div style={sidebarContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <FiUser className="text-slate-800" size={18} />
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>Single Profile Hub</h3>
            </div>

            <div style={{ position: 'relative', marginBottom: '15px' }}>
              <select 
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                style={sidebarSelectInput}
              >
                <option value="">-- Select Customer File --</option>
                {allLoans.map((loan) => (
                  <option key={loan._id} value={loan.loanId}>
                    {loan.customerName?.toUpperCase()} ({loan.loanId})
                  </option>
                ))}
              </select>
            </div>

            {selectedLoanRecord ? (
              <div style={profileCardPane}>
                
                {/* 1. Header Snapshot Block */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                  <img 
                    src={coreCustomerProfile?.photo || selectedLoanRecord.customerId?.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                    alt="Master Registry Avatar" 
                    style={sidebarAvatarStyle}
                    onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                      {selectedLoanRecord.customerName}
                    </h4>
                    <span style={miniFileIdBadge}>ID: {selectedLoanRecord.loanId}</span>
                  </div>
                </div>

                {/* 🔥 2. FINANCIAL METRICS (Shifted Upwards perfectly) */}
                <div style={ledgerBreakdownContainer}>
                  <div style={ledgerMiniCard}>
                    <span style={miniCardLabel}>Total Loan Amount</span>
                    <strong style={miniCardVal}>₹{Number(selectedLoanRecord.amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={ledgerMiniCard}>
                    <span style={miniCardLabel}>Total Paid Volume</span>
                    <strong style={{ ...miniCardVal, color: '#16a34a' }}>₹{Number(selectedLoanRecord.totalPaid || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ ...ledgerMiniCard, borderBottom: 'none', paddingBottom: 0 }}>
                    <span style={miniCardLabel}>Remaining Pending</span>
                    <strong style={{ ...miniCardVal, color: '#dc2626' }}>₹{Number(selectedLoanRecord.totalPending || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* 🔥 3. COMPREHENSIVE KYC RECORDS CORE HOOKS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '15px 0 8px 0', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>
                  <FiInfo /> Deep Registry KYC Records
                </div>
                
                <div style={metaMetricsBlock}>
                  <div style={metaRow}>
                    <span style={metaLabel}>Nominee Name</span>
                    <span style={metaValue}>{selectedLoanRecord.nomineeName || coreCustomerProfile?.nomineeName || selectedLoanRecord.customerId?.nomineeName || 'N/A'}</span>
                  </div>
                  <div style={metaRow}>
                    <span style={metaLabel}>Phone Number</span>
                    <span style={metaValue}>{coreCustomerProfile?.mobile || selectedLoanRecord.customerMobile || selectedLoanRecord.customerId?.mobile || 'N/A'}</span>
                  </div>
                  <div style={metaRow}>
                    <span style={metaLabel}>Email Address</span>
                    <span style={{ ...metaValue, textTransform: 'none', fontSize: '10px' }}>{coreCustomerProfile?.email || selectedLoanRecord.customerId?.email || 'N/A'}</span>
                  </div>
                  <div style={metaRow}>
                    <span style={metaLabel}>Aadhaar Card</span>
                    <span style={metaValue}>{coreCustomerProfile?.aadhaar || selectedLoanRecord.customerId?.aadhaar || selectedLoanRecord.aadhaar || 'N/A'}</span>
                  </div>
                  <div style={metaRow}>
                    <span style={metaLabel}>PAN Card Number</span>
                    <span style={{ ...metaValue, textTransform: 'uppercase' }}>{coreCustomerProfile?.pan || selectedLoanRecord.customerId?.pan || 'N/A'}</span>
                  </div>
                  <div style={metaRow}>
                    <span style={metaLabel}>Bank Registry</span>
                    <span style={metaValue}>{coreCustomerProfile?.bankName || selectedLoanRecord.customerId?.bankName || selectedLoanRecord.bankDetails?.bankName || 'N/A'}</span>
                  </div>
                  <div style={metaRow}>
                    <span style={metaLabel}>Account Number</span>
                    <span style={metaValue}>{coreCustomerProfile?.accountNumber || selectedLoanRecord.customerId?.accountNumber || selectedLoanRecord.bankDetails?.accountNumber || 'N/A'}</span>
                  </div>
                  <div style={{ ...metaRow, border: 'none', paddingBottom: 0, marginBottom: 0 }}>
                    <span style={metaLabel}>IFSC Code</span>
                    <span style={{ ...metaValue, textTransform: 'uppercase' }}>{coreCustomerProfile?.ifsc || selectedLoanRecord.customerId?.ifsc || selectedLoanRecord.bankDetails?.ifsc || 'N/A'}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handlePrintAction(selectedLoanRecord.loanId)}
                  style={printTargetBtn}
                >
                  <FiPrinter size={13} /> Print Isolate Statement Dossier
                </button>
              </div>
            ) : (
              <div style={emptySidebarPlaceholder}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                Choose a client profile from the control menu above to populate upper parameters.
              </div>
            )}

          </div>
        </div>

      </div>

      {/* =========================================================================
          3️⃣ MASTER COMPREHENSIVE OUTPUT LAYER ENVIRONMENT (Visible on Print Only)
         ========================================================================= */}
      <div className="print-dossier" style={{ display: 'none' }}>
        <div style={printHeaderContainer}>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: '0 0 4px 0', fontWeight: '900', letterSpacing: '-1px', fontSize: '20px' }}>D-FINANCE SOLUTIONS</h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Master Branch Node: Mathura Central, UP</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748b' }}>Official System Portfolio Statement Registry</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
            <div>Print Date: {new Date().toLocaleDateString('en-IN')}</div>
            <div>Print Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="print-all-only" style={{ marginTop: '5px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px' }}>
              Today's Gross Recovery: ₹{totalToday.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* PRINT SHEET SEGMENT A (Cashflows Summary) */}
        <div className="print-all-only">
          <h3 style={sectionDividerTitle}>SECTION A: Daily Terminal Cash-In Logs</h3>
          <table style={printTableStyle}>
            <thead>
              <tr style={printTableHeaderRow}>
                <th style={printTh}>TIME</th>
                <th style={printTh}>LOAN FILE ID</th>
                <th style={printTh}>CLIENT DIRECTORY NAME</th>
                <th style={printTh}>RECOVERY AMT</th>
                <th style={printTh}>SETTLEMENT TYPE</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((pay, idx) => (
                <tr key={pay._id || idx} style={printTableRowStyle}>
                  <td style={printTd}>{new Date(pay.paymentDate || pay.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ ...printTd, fontWeight: 'bold' }}>{pay.loanId}</td>
                  <td style={printTd}>{pay.customerName}</td>
                  <td style={{ ...printTd, fontWeight: '900' }}>₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                  <td style={{ ...printTd, textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }}>{detectPaymentMethod(pay.utr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PRINT SHEET SEGMENT B (Deep Master Accounts Statements) */}
        <h3 className="print-all-only" style={{ ...sectionDividerTitle, marginTop: '30px' }}>SECTION B: Comprehensive Master Loan Portfolio Registry</h3>
        
        {allLoans.map((loan, index) => {
          // Relational lookup for matching printed records mapping loops
          const matchedCustomer = allCustomers.find(c => c._id === loan.customerId?._id || c._id === loan.customerId);
          
          const profilePhoto = matchedCustomer?.photo || loan.customerId?.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
          const clientMobile = matchedCustomer?.mobile || loan.customerMobile || loan.customerId?.mobile || "N/A";
          const clientAadhaar = matchedCustomer?.aadhaar || loan.customerId?.aadhaar || loan.aadhaar || "N/A";

          return (
            <div key={loan._id || index} className={`dossier-card dossier-card-${loan.loanId}`} style={dossierPrintCard}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '15px' }}>
                <img 
                  src={profilePhoto} 
                  alt="KYC Identity Verification Print" 
                  style={dossierPrintAvatar}
                  onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
                />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>
                    {loan.customerName}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 15px', fontSize: '11px', color: '#334155' }}>
                    <div>📱 <strong>Mobile Number:</strong> {clientMobile}</div>
                    <div>🪪 <strong>Aadhaar Card No:</strong> {clientAadhaar}</div>
                    <div>📋 <strong>Nominee Name:</strong> {loan.nomineeName || matchedCustomer?.nomineeName || 'N/A'}</div>
                    <div>💳 <strong>PAN Card Registry:</strong> {matchedCustomer?.pan?.toUpperCase() || 'N/A'}</div>
                    <div>✉️ <strong>Email Address:</strong> {matchedCustomer?.email || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={printIdBadge}>FILE ID: {loan.loanId}</span>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Status: {loan.status}
                  </div>
                </div>
              </div>

              {/* Bank Metadata Verification Print Block */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '11px', marginBottom: '15px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px', color: '#1e293b' }}>
                <div>🏛️ <strong>Bank Name:</strong> {matchedCustomer?.bankName || loan.bankDetails?.bankName || 'N/A'}</div>
                <div>🔢 <strong>Account Number:</strong> {matchedCustomer?.accountNumber || loan.bankDetails?.accountNumber || 'N/A'}</div>
                <div>⚡ <strong>IFSC Code:</strong> {matchedCustomer?.ifsc?.toUpperCase() || loan.bankDetails?.ifsc?.toUpperCase() || 'N/A'}</div>
              </div>

              {/* Financial Balances Ledger Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', background: '#f8fafc', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div>
                  <span style={dossierMetaLabel}>Sanctioned Principal Amount</span>
                  <div style={dossierMetaVal}>₹{Number(loan.amount || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={dossierMetaLabel}>Aggregate Recovery Volume</span>
                  <div style={{ ...dossierMetaVal, color: '#16a34a' }}>₹{Number(loan.totalPaid || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={dossierMetaLabel}>Outstanding Pending Liability</span>
                  <div style={{ ...dossierMetaVal, color: '#dc2626' }}>₹{Number(loan.totalPending || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

// =========================================================================
// STYLING MAP STRUCTS DEFINITIONS
// =========================================================================
const mainSplitGrid = { display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' };
const leftSplitColumn = { flex: '2.8', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' };
const rightSplitColumn = { flex: '1.2', minWidth: '310px' };

const sidebarContainer = { background: '#fff', border: '1px solid #f1f5f9', borderRadius: '28px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'sticky', top: '20px' };
const sidebarSelectInput = { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '12px 15px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' };
const emptySidebarPlaceholder = { textAlign: 'center', padding: '50px 20px', border: '2px dashed #e2e8f0', borderRadius: '25px', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', lineHeight: '1.6' };

const profileCardPane = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '15px', boxSizing: 'border-box' };
const sidebarAvatarStyle = { width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.06)' };
const miniFileIdBadge = { background: '#0f172a', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '2px 8px', borderRadius: '5px', display: 'inline-block', marginTop: '3px' };

// REARRANGED FINANCIAL TOP LAYER COMPONENT STYLING
const ledgerBreakdownContainer = { display: 'grid', gridTemplateColumns: '1fr', gap: '8px', background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '16px', marginBottom: '15px' };
const ledgerMiniCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' };
const miniCardLabel = { fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' };
const miniCardVal = { fontSize: '12px', fontWeight: '900', color: '#0f172a' };

const metaMetricsBlock = { display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '16px', padding: '12px', border: '1px solid #e2e8f0' };
const metaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px', fontSize: '11px', gap: '10px' };
const metaLabel = { color: '#64748b', fontWeight: 'bold', shrink: '0' };
const metaValue = { color: '#0f172a', fontWeight: '900', textAlign: 'right' };
const printTargetBtn = { width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '15px', boxShadow: '0 4px 10px rgba(37,99,235,0.15)' };

// Master Styles Mapping
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px', flexWrap: 'wrap' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' };
const statCard = { background: '#fff', padding: '18px 20px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', border: '1px solid #f1f5f9' };
const labelStyle = { fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' };
const valStyle = { fontSize: '22px', fontWeight: '900', margin: '4px 0 0 0', letterSpacing: '-0.5px' };
const tableCard = { background: '#fff', borderRadius: '32px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeader = { borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' };
const tableRow = { borderBottom: '1px solid #f8fafc', fontSize: '13px', color: '#334155' };
const idTag = { background: '#f1f5f9', color: '#1e293b', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '900' };

// Method Tag color switching logic generator
const methodTag = (type) => ({
  fontSize: '9px', fontWeight: '900', 
  color: type.includes('ONLINE') ? '#059669' : '#d97706', 
  textTransform: 'uppercase', 
  border: `1px solid ${type.includes('ONLINE') ? '#a7f3d0' : '#fde68a'}`, 
  background: type.includes('ONLINE') ? '#ecfdf5' : '#fffbeb', 
  padding: '3px 8px', borderRadius: '6px'
});

const refreshBtn = { background: '#fff', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const printSummaryBtn = { background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(15,23,42,0.15)' };
const loaderStyle = { textAlign: 'center', marginTop: '120px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px', fontSize: '12px' };
const emptyText = { textAlign: 'center', padding: '60px', color: '#cbd5e1', fontSize: '12px', fontWeight: 'bold' };

const printHeaderContainer = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #0f172a', paddingBottom: '15px', marginBottom: '20px' };
const sectionDividerTitle = { fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', background: '#0f172a', color: '#fff', padding: '5px 10px', margin: '20px 0 10px 0', borderRadius: '4px' };
const printTableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '11px' };
const printTableHeaderRow = { background: '#f1f5f9', borderBottom: '1px solid #94a3b8' };
const printTh = { padding: '8px 10px', fontWeight: '900', textAlign: 'left', fontSize: '9px', color: '#334155' };
const printTableRowStyle = { borderBottom: '1px solid #e2e8f0' };
const printTd = { padding: '8px 10px', color: '#000' };
const dossierPrintCard = { border: '1px solid #cbd5e1', borderRadius: '12px', padding: '15px', marginBottom: '15px', background: '#fff', pageBreakInside: 'avoid' };
const dossierPrintAvatar = { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' };
const printIdBadge = { background: '#0f172a', color: '#fff', fontWeight: '900', fontSize: '10px', padding: '3px 8px', borderRadius: '4px' };
const dossierMetaLabel = { fontSize: '8px', textTransform: 'uppercase', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '2px' };
const dossierMetaVal = { fontSize: '14px', fontWeight: '900', color: '#0f172a' };

export default DailyCollectionReport;