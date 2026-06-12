import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { 
  FiCalendar, FiPrinter, FiDollarSign, FiUsers, FiActivity, 
  FiRefreshCw, FiUser, FiInfo, FiCreditCard, FiClock, FiCheckSquare, FiBriefcase, FiMapPin, FiHome 
} from 'react-icons/fi';

const DailyCollectionReport = () => {
  const [collections, setCollections] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  
  // PRINT CONTROLLER STATES
  const [printTarget, setPrintTarget] = useState('ALL'); 
  const [selectedProfileId, setSelectedProfileId] = useState(''); 

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [resReport, resLoans, resCustomers] = await Promise.all([
        API.get('/admin/collection-report').catch(() => ({ data: [] })),
        API.get('/admin/all-loans').catch(() => ({ data: [] })),
        API.get('/admin/all-customers').catch(() => ({ data: [] })) 
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

  // DETECT TRUE MASTER PROFILE VIA FRONTEND LOOKUP
  const coreCustomerProfile = allCustomers.find(c => 
    c._id === selectedLoanRecord?.customerId?._id || 
    c._id === selectedLoanRecord?.customerId
  );

  // Compile Advisor Metrics
  const staffPerformanceRecords = () => {
    const metrics = {};
    allLoans.forEach(loan => {
      const staffName = loan.verifiedByName || loan.verifiedBy || loan.advisorId || "Field Officer Node";
      if (!metrics[staffName]) {
        metrics[staffName] = { name: staffName, totalApproved: 0, totalVolume: 0 };
      }
      metrics[staffName].totalApproved += 1;
      metrics[staffName].totalVolume += Number(loan.amount || 0);
    });
    return Object.values(metrics);
  };

  const detectPaymentMethod = (utrString) => {
    if (!utrString) return "OFFLINE (Cash)";
    const utr = String(utrString).trim();
    if (utr.startsWith("PAY-") || utr.startsWith("cf_") || /^\d{10,15}$/.test(utr)) {
      return "ONLINE (Cashfree)";
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

  if (loading) return <div style={loaderStyle}>SYSTEM HARDWARE RESYNCING LEDGERS FROM PRAYAGRAJ CLUSTERS...</div>;

  const printStyles = `
    @media print {
      body, html, #root, .portal-container, main, div, aside {
        overflow: visible !important;
        position: static !important;
        height: auto !important;
        max-height: none !important;
        box-shadow: none !important;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-size: 10px !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .print-dossier {
        display: block !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        z-index: 99999 !important;
      }
      @page {
        size: A4 portrait;
        margin: 15mm 12mm 15mm 12mm;
      }
      .dossier-print-card-layout {
        border: 2px solid #000000 !important;
        padding: 20px !important;
        margin-bottom: 25px !important;
        page-break-inside: auto !important;
        background: #ffffff !important;
      }
      ${printTarget !== 'ALL' ? `
        .print-all-only { display: none !important; }
        .dossier-card { display: none !important; }
        .dossier-card-${printTarget} { 
          display: block !important; 
        }
      ` : ''}
    }
  `;

  return (
    <div style={{ padding: '20px 3%', background: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <style>{printStyles}</style>

      {/* =========================================================================
          1️⃣ ACTIONS HEADER BAR (Screen Only)
         ========================================================================= */}
      <div className="no-print" style={headerStyle}>
        <div>
          <h2 style={{ color: '#0f172a', margin: 0, fontWeight: '950', textTransform: 'uppercase', letterSpacing: '-1px', fontSize: '24px' }}>
            📊 D-Finance System Auditor
          </h2>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', marginTop: '3px' }}>
            Prayagraj Core Hub Node | Consolidated Financial & Operational Ledger Statement
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchReportData} style={refreshBtn}>
            <FiRefreshCw /> Resync Active Pipeline
          </button>
          <button onClick={() => handlePrintAction('ALL')} style={printSummaryBtn}>
            <FiPrinter /> Export & Print Reports
          </button>
        </div>
      </div>

      {/* =========================================================================
          2️⃣ DUAL LAYOUT GRID FRAMEWORK PANEL (Workspace Stream)
         ========================================================================= */}
      <div className="no-print" style={mainSplitGrid}>
        
        {/* LEFT COMPONENT COLUMN */}
        <div style={leftSplitColumn}>
          
          <div style={statsGrid}>
            <div style={{ ...statCard, borderLeft: '6px solid #3b82f6' }}>
              <label style={labelStyle}>Total System Audits</label>
              <h2 style={{ ...valStyle, color: '#1e293b' }}>{allLoans.length} Contracts</h2>
            </div>
            <div style={{ ...statCard, borderLeft: '6px solid #10b981' }}>
              <label style={labelStyle}>Total Disbursed Book</label>
              <h2 style={{ ...valStyle, color: '#10b981' }}>
                ₹{allLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0).toLocaleString('en-IN')}
              </h2>
            </div>
            <div style={{ ...statCard, borderLeft: '6px solid #059669' }}>
              <label style={labelStyle}>Today's Recovery Cash-In</label>
              <h2 style={{ ...valStyle, color: '#059669' }}>₹{totalToday.toLocaleString('en-IN')}</h2>
            </div>
          </div>

          {/* STAFF METRICS WORKSPACE */}
          <div style={tableCard}>
            <div style={tableCardHeader}>
              <FiBriefcase className="text-blue-600" size={16} />
              <h3 style={tableCardTitle}>Personnel Verification Performance Registry</h3>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeader}>
                  <th style={{ padding: '12px' }}>Staff Personnel Name</th>
                  <th style={{ padding: '12px' }}>Files Processed</th>
                  <th style={{ padding: '12px' }}>Total Amount Handled</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformanceRecords().map((staff, idx) => (
                  <tr key={idx} style={tableRow}>
                    <td style={{ padding: '12px', fontWeight: '900', color: '#0f172a' }}>{String(staff.name).toUpperCase()}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2563eb' }}>{staff.totalApproved} Loans Approved</td>
                    <td style={{ padding: '12px', fontWeight: '900' }}>₹{staff.totalVolume.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* LIVE STREAM RECEIPTS TABLE */}
          <div style={tableCard}>
            <div style={tableCardHeader}>
              <FiActivity className="text-emerald-600" size={16} />
              <h3 style={tableCardTitle}>Live Cash Collection Flow Log</h3>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeader}>
                  <th style={{ padding: '12px' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px' }}>LOAN ID</th>
                  <th style={{ padding: '12px' }}>CUSTOMER DIRECTION</th>
                  <th style={{ padding: '12px' }}>RECOVERY VALUE</th>
                  <th style={{ padding: '12px' }}>METHOD TYPE</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((pay, i) => (
                  <tr key={i} style={tableRow}>
                    <td style={{ padding: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
                      {new Date(pay.paymentDate || pay.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px' }}><span style={idTag}>{pay.loanId}</span></td>
                    <td style={{ padding: '12px', fontWeight: '900', textTransform: 'uppercase' }}>{pay.customerName}</td>
                    <td style={{ padding: '12px', fontWeight: '950', color: '#059669' }}>₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={methodTag(detectPaymentMethod(pay.utr))}>
                        {detectPaymentMethod(pay.utr)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SIDE PANEL: SINGLE ACCOUNT SIDEBAR DETAILS EXPLORER */}
        <div style={rightSplitColumn}>
          <div style={sidebarContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <FiUser className="text-slate-900" size={18} />
              <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '900' }}>Deep Account Profiler</h3>
            </div>

            <select 
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              style={sidebarSelectInput}
            >
              <option value="">-- Choose Account Portfolio --</option>
              {allLoans.map((loan) => (
                <option key={loan._id} value={loan.loanId}>
                  {String(loan.customerName).toUpperCase()} ({loan.loanId})
                </option>
              ))}
            </select>

            {selectedLoanRecord ? (
              <div style={profileCardPane}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                  <img 
                    src={selectedLoanRecord.custLivePhoto || coreCustomerProfile?.custLivePhoto || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                    alt="Customer Live KYC Token" 
                    style={sidebarAvatarStyle}
                    onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '950', color: '#0f172a', textTransform: 'uppercase' }}>
                      {selectedLoanRecord.customerName}
                    </h4>
                    <span style={miniFileIdBadge}>LID: {selectedLoanRecord.loanId}</span>
                  </div>
                </div>

                <div style={ledgerBreakdownContainer}>
                  <div style={ledgerMiniCard}><span>Sanctioned Principal</span><strong>₹{Number(selectedLoanRecord.amount || 0).toLocaleString('en-IN')}</strong></div>
                  <div style={ledgerMiniCard}><span>Total Collections</span><strong style={{ color: '#10b981' }}>₹{Number(selectedLoanRecord.totalPaid || 0).toLocaleString('en-IN')}</strong></div>
                  <div style={ledgerMiniCard}><span>Remaining Balance</span><strong style={{ color: '#f43f5e' }}>₹{Number(selectedLoanRecord.totalPending || 0).toLocaleString('en-IN')}</strong></div>
                </div>

                <div style={metaHeadingStyle}><FiInfo /> Operational Verification Parameters</div>
                <div style={metaMetricsBlock}>
                  <div style={metaRow}><span>Nominee Name</span><span style={metaValue}>{selectedLoanRecord.nomineeName || 'N/A'}</span></div>
                  <div style={metaRow}><span>Nominee Relation</span><span style={metaValue}>{selectedLoanRecord.nomineeRelation || 'N/A'}</span></div>
                  <div style={metaRow}><span>Nominee Contact</span><span style={metaValue}>{selectedLoanRecord.nomineeMobile || 'N/A'}</span></div>
                  <div style={metaRow}><span>Verified By Staff</span><span style={metaValue}>{selectedLoanRecord.verifiedByName || 'System Node'}</span></div>
                  <div style={metaRow}><span>Branch Area Network</span><span style={metaValue}>{selectedLoanRecord.branchName || 'N/A'}</span></div>
                  <div style={metaRow}><span>Settlement Bank</span><span style={metaValue}>{selectedLoanRecord.bankName || 'N/A'}</span></div>
                  <div style={metaRow}><span>Account Number</span><span style={metaValue}>{selectedLoanRecord.accountNumber || 'N/A'}</span></div>
                  <div style={metaRow}><span>IFSC System Code</span><span style={{ ...metaValue, textTransform: 'uppercase' }}>{selectedLoanRecord.ifscCode || 'N/A'}</span></div>
                  <div style={metaRow}><span>Area Demographics</span><span style={metaValue}>{selectedLoanRecord.areaType || 'N/A'}</span></div>
                  <div style={metaRow}><span>Housing Nature</span><span style={metaValue}>{selectedLoanRecord.residenceNature || 'N/A'}</span></div>
                  <div style={metaRow}><span>Structure Build</span><span style={metaValue}>{selectedLoanRecord.houseType || 'N/A'}</span></div>
                  <div style={metaRow}><span>Rooms Count</span><span style={metaValue}>{selectedLoanRecord.noOfRooms || 'N/A'}</span></div>
                  <div style={metaRow}><span>House Inhabitants</span><span style={metaValue}>{selectedLoanRecord.noOfMembers || 'N/A'}</span></div>
                  <div style={metaRow}><span>Years of Stay</span><span style={metaValue}>{selectedLoanRecord.houseStay || '0'} Yrs</span></div>
                  <div style={metaRow}><span>Drinking Water Sourced</span><span style={metaValue}>{selectedLoanRecord.drinkingWater || 'N/A'}</span></div>
                  <div style={metaRow}><span>Earning Capitalists</span><span style={metaValue}>{selectedLoanRecord.earningMembers || '0'} Members</span></div>
                  <div style={metaRow}><span>Occupation Profile</span><span style={metaValue}>{selectedLoanRecord.memberOccupation || 'N/A'}</span></div>
                  <div style={metaRow}><span>Monthly Yield Income</span><span style={metaValue}>₹{Number(selectedLoanRecord.monthlyIncome || 0).toLocaleString('en-IN')}</span></div>
                  <div style={metaRow}><span>Estimated Networth</span><span style={metaValue}>₹{Number(selectedLoanRecord.networth || 0).toLocaleString('en-IN')}</span></div>
                  <div style={metaRow}><span>Aggregated Livestock</span><span style={metaValue}>{selectedLoanRecord.cows || '0'} Heads</span></div>
                  <div style={{ ...metaRow, border: 'none', paddingBottom: 0, marginBottom: 0 }}><span>Target Geolocation Name</span><span style={{ ...metaValue, fontSize: '9px', maxWidth: '160px', wordBreak: 'break-word', display: 'block' }}>{selectedLoanRecord.locationName || 'N/A'}</span></div>
                </div>

                {/* 🔥 FIXED SIDEBAR EMI: Safe Array Length Evaluation */}
                <div style={metaHeadingStyle}><FiClock /> Installment Recovery Amortization Matrix</div>
                <div style={amortizationCalendarBox}>
                  {Array.from({ length: Number(selectedLoanRecord.totalInstallments) || 1 }).map((_, idx) => {
                    const numberInst = idx + 1;
                    const emiVal = Number(selectedLoanRecord.installmentAmount || 0);
                    const checkPaid = Number(selectedLoanRecord.totalPaid || 0) >= (numberInst * emiVal);
                    
                    let emiDateObj = new Date(selectedLoanRecord.appliedDate?.$date || selectedLoanRecord.appliedDate || Date.now());
                    if (isNaN(emiDateObj.getTime())) emiDateObj = new Date();

                    if (selectedLoanRecord.emiType === 'Weekly EMI') {
                      emiDateObj.setDate(emiDateObj.getDate() + (numberInst * 7));
                    } else {
                      emiDateObj.setDate(emiDateObj.getDate() + numberInst);
                    }

                    return (
                      <div key={numberInst} style={calendarRow}>
                        <span style={{ ...calendarIndexTag, background: checkPaid ? '#64748b' : '#2563eb' }}>E-{numberInst}</span>
                        <div style={{ flex: 1, paddingLeft: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '900' }}>₹{emiVal.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold' }}>📅 {emiDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        </div>
                        <span style={checkPaid ? innerPaidBadgeStyle : innerDueBadgeStyle}>{checkPaid ? "Paid" : "Due"}</span>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => handlePrintAction(selectedLoanRecord.loanId)} style={printTargetBtn}>
                  <FiPrinter size={13} /> Export Isolate Profile Document
                </button>
              </div>
            ) : (
              <div style={emptySidebarPlaceholder}>Choose a target account file identifier path node from options box to populate parameters.</div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3️⃣ MASTER OVERHEAD PRINTING DISPATCH ENVIRONMENT (Print Mode Only)
         ========================================================================= */}
      <div className="print-dossier" style={{ display: 'none' }}>
        
        <div style={printHeaderContainer}>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: '0 0 3px 0', fontWeight: '950', letterSpacing: '-1.5px', fontSize: '24px', color: '#0f172a' }}>D-FINANCE SOLUTIONS</h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#334155', fontWeight: '900', textTransform: 'uppercase' }}>Central Corporate Cluster Node: Prayagraj Branch, UP</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>Consolidated General Amortization Ledger & Audit Statement Document</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.4' }}>
            <div>System Dispatch Date: {new Date().toLocaleDateString('en-IN')}</div>
            <div>Database Sync Frame: Verified Secure</div>
            <div className="print-all-only" style={{ marginTop: '5px', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              Today's Aggregate Cash Recovery Volume: ₹{totalToday.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="print-all-only">
          <h3 style={sectionDividerTitle}>SECTION A: Daily Cash-In Settlement Logs</h3>
          <table style={printTableStyle}>
            <thead>
              <tr style={printTableHeaderRow}>
                <th style={printTh}>TIMESTAMP</th>
                <th style={printTh}>LOAN REF FILE ID</th>
                <th style={printTh}>CLIENT DIRECTORY NAME</th>
                <th style={printTh}>RECOVERY AMT VALUE</th>
                <th style={printTh}>SETTLEMENT TYPE</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((pay, idx) => (
                <tr key={idx} style={printTableRowStyle}>
                  <td style={printTd}>{new Date(pay.paymentDate || pay.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ ...printTd, fontWeight: 'bold' }}>{pay.loanId}</td>
                  <td style={{ ...printTd, textTransform: 'uppercase', fontWeight: 'bold' }}>{pay.customerName}</td>
                  <td style={{ ...printTd, fontWeight: '950' }}>₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                  <td style={{ ...printTd, textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>{detectPaymentMethod(pay.utr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="print-all-only" style={{ ...sectionDividerTitle, marginTop: '35px' }}>SECTION B: Comprehensive Master Loan Portfolio Records Registry</h3>
        
        {allLoans.map((loan, index) => {
          const matchedCustomer = allCustomers.find(c => c._id === loan.customerId?._id || c._id === loan.customerId);
          const profilePhoto = loan.custLivePhoto || matchedCustomer?.custLivePhoto || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
          const clientMobile = matchedCustomer?.mobile || loan.customerMobile || "N/A";

          return (
            <div key={index} className={`dossier-print-card-layout dossier-card dossier-card-${loan.loanId}`} style={dossierPrintCard}>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '12px', marginBottom: '15px' }}>
                <img 
                  src={profilePhoto} 
                  alt="KYC Verification Core Token Proof" 
                  style={dossierPrintAvatar}
                  onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
                />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '950', textTransform: 'uppercase', color: '#000000' }}>
                    {loan.customerName}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px', fontSize: '10px', color: '#000000' }}>
                    <div><strong>Aadhaar Card Secure Number:</strong> [Aadhaar Redacted for Privacy Compliance]</div>
                    <div><strong>Nominee Authorized Name:</strong> {loan.nomineeName || 'N/A'}</div>
                    <div><strong>Nominee Relationship Aspect:</strong> {loan.nomineeRelation || 'N/A'}</div>
                    <div><strong>Nominee Secure Track Mobile:</strong> {loan.nomineeMobile || 'N/A'}</div>
                    <div><strong>Verified Inspector Staff Name:</strong> {loan.verifiedByName || 'System Node'}</div>
                    <div><strong>Next Scheduled EMI Date Frame:</strong> {loan.nextEmiDate?.$date ? new Date(loan.nextEmiDate.$date).toLocaleDateString('en-IN') : 'N/A'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={printIdBadge}>FILE ID: {loan.loanId}</span>
                  <div style={{ fontSize: '9px', marginTop: '6px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000' }}>
                    Scope Status: {loan.status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', fontSize: '10px', marginBottom: '15px', borderBottom: '1px dashed #000000', paddingBottom: '10px', color: '#000000' }}>
                <div><strong>Area Demographics:</strong> {loan.areaType || 'N/A'}</div>
                <div><strong>Residence Nature:</strong> {loan.residenceNature || 'N/A'}</div>
                <div><strong>Structure Build Type:</strong> {loan.houseType || 'N/A'}</div>
                <div><strong>Rooms Count:</strong> {loan.noOfRooms || 'N/A'}</div>
                <div><strong>House Inhabitants:</strong> {loan.noOfMembers || 'N/A'}</div>
                <div><strong>Years of Stay:</strong> {loan.houseStay || '0'} Yrs</div>
                <div><strong>Earning Members:</strong> {loan.earningMembers || '0'}</div>
                <div><strong>Occupation Profile:</strong> {loan.memberOccupation || 'N/A'}</div>
                <div><strong>Monthly Yield:</strong> ₹{Number(loan.monthlyIncome || 0).toLocaleString('en-IN')}</div>
                <div><strong>Estimated Networth:</strong> ₹{Number(loan.networth || 0).toLocaleString('en-IN')}</div>
                <div><strong>Livestock Heads:</strong> {loan.cows || '0'}</div>
                <div><strong>Drinking Water:</strong> {loan.drinkingWater || 'N/A'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '10px', marginBottom: '15px', borderBottom: '1px dashed #000000', paddingBottom: '10px', color: '#000000' }}>
                <div><strong>Settlement Bank Destination:</strong> {loan.bankName || 'N/A'}</div>
                <div><strong>Branch Cluster Area Name:</strong> {loan.branchName || 'N/A'}</div>
                <div><strong>Account Number Mapping:</strong> {loan.accountNumber || 'N/A'}</div>
                <div><strong>IFSC Central Node Routing:</strong> {String(loan.ifscCode).toUpperCase() || 'N/A'}</div>
              </div>

              <div style={{ fontSize: '9px', color: '#000000', marginBottom: '15px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                📍 <strong>Verified Geolocation Path Name:</strong> {loan.locationName || 'N/A'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', padding: '10px 15px', border: '1px solid #000000', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                  <span style={dossierMetaLabel}>Contracted Principal Balance</span>
                  <div style={{ ...dossierMetaVal, color: '#000' }}>₹{Number(loan.amount || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={dossierMetaLabel}>Aggregate Clear Payouts</span>
                  <div style={{ ...dossierMetaVal, color: '#000' }}>₹{Number(loan.totalPaid || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={dossierMetaLabel}>Outstanding Debt Liability</span>
                  <div style={{ ...dossierMetaVal, color: '#000' }}>₹{Number(loan.totalPending || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* 🔥 FIXED PRINT EMI: Safe Array Length Evaluation */}
              <div style={{ marginTop: '20px', pageBreakInside: 'auto' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '950', borderBottom: '1px solid #000000', paddingBottom: '4px', textTransform: 'uppercase', color: '#000000', letterSpacing: '0.3px' }}>
                  Consolidated Recovery Installment Calendar Schedule
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
                  {Array.from({ length: Number(loan.totalInstallments) || 1 }).map((_, idx) => {
                    const instNo = idx + 1;
                    const emiAmtVal = Number(loan.installmentAmount || 0);
                    const isSettledRow = Number(loan.totalPaid || 0) >= (instNo * emiAmtVal);
                    
                    let emiDateObj = new Date(loan.appliedDate?.$date || loan.appliedDate || Date.now());
                    if (isNaN(emiDateObj.getTime())) emiDateObj = new Date();

                    if (loan.emiType === 'Weekly EMI') {
                      emiDateObj.setDate(emiDateObj.getDate() + (instNo * 7));
                    } else {
                      emiDateObj.setDate(emiDateObj.getDate() + instNo);
                    }

                    return (
                      <div key={instNo} style={{ border: '1px solid #000000', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                        <div>
                          <div style={{ fontWeight: '950', fontSize: '11px' }}>Inst {instNo}: ₹{emiAmtVal.toFixed(0)}</div>
                          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>📅 {emiDateObj.toLocaleDateString('en-IN')}</div>
                        </div>
                        <span style={{ fontWeight: '950', fontSize: '9px', color: '#000000' }}>
                          {isSettledRow ? '[PAID]' : '[DUE]'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', paddingTop: '15px', borderTop: '1px dashed #000000', pageBreakInside: 'avoid' }}>
                <div style={{ textAlign: 'center', width: '30%' }}>
                  <div style={{ borderBottom: '1px solid #000000', width: '85%', margin: '0 auto 6px auto', height: '35px' }}></div>
                  <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', color: '#000000' }}>Client / Borrower Sign</span>
                </div>
                <div style={{ textAlign: 'center', width: '30%' }}>
                  <div style={{ borderBottom: '1px solid #000000', width: '85%', margin: '0 auto 6px auto', height: '35px' }}></div>
                  <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', color: '#000000' }}>Field Advisor Sign</span>
                </div>
                <div style={{ textAlign: 'center', width: '30%' }}>
                  <div style={{ borderBottom: '1px solid #000000', width: '85%', margin: '0 auto 6px auto', height: '35px' }}></div>
                  <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', color: '#000000' }}>Authorized Audit Manager</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginTop: '25px', pageBreakInside: 'avoid' }}>
                {loan.passbookPic && (
                  <div>
                    <span style={dossierMetaLabel}>Passbook/Cheque Proof</span>
                    <img src={loan.passbookPic} alt="Passbook Evidence" style={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #000' }} />
                  </div>
                )}
                {(loan.custAadhaarBack || matchedCustomer?.custAadhaarBack) ? (
                  <div>
                    <span style={dossierMetaLabel}>Aadhaar Back Attachment</span>
                    <img src={loan.custAadhaarBack || matchedCustomer?.custAadhaarBack} alt="Aadhaar Back Evidence" style={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #000' }} />
                  </div>
                ) : null}
                {(loan.custAadhaarFront || matchedCustomer?.custAadhaarFront) ? (
                  <div>
                    <span style={dossierMetaLabel}>Aadhaar Front Check</span>
                    <img src={loan.custAadhaarFront || matchedCustomer?.custAadhaarFront} alt="Aadhaar Front Evidence" style={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #000' }} />
                  </div>
                ) : null}
                {(loan.nomineePic || matchedCustomer?.nomineePic) ? (
                  <div>
                    <span style={dossierMetaLabel}>Nominee KYC Snapshot</span>
                    <img src={loan.nomineePic || matchedCustomer?.nomineePic} alt="Nominee Visual Proof" style={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #000' }} />
                  </div>
                ) : null}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

// =========================================================================
// STYLING MAP HOOKS Blueprints
// =========================================================================
const mainSplitGrid = { display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' };
const leftSplitColumn = { flex: '2.6', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '25px' };
const rightSplitColumn = { flex: '1.4', minWidth: '320px' };

const sidebarContainer = { background: '#fff', border: '1px solid #eef2f6', borderRadius: '30px', padding: '20px', boxShadow: '0 15px 30px rgba(0,0,0,0.01)', position: 'sticky', top: '20px' };
const sidebarSelectInput = { width: '100%', background: '#f8fafc', border: '2px solid #e2e8f0', color: '#0f172a', padding: '12px 15px', borderRadius: '14px', fontSize: '13px', fontWeight: '900', outline: 'none' };
const emptySidebarPlaceholder = { textAlign: 'center', padding: '60px 20px', border: '2px dashed #cbd5e1', borderRadius: '24px', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', lineHeight: '1.6' };

const profileCardPane = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '15px', boxSizing: 'border-box', marginTop: '15px' };
const sidebarAvatarStyle = { width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' };
const miniFileIdBadge = { background: '#0f172a', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '3px 8px', borderRadius: '5px', display: 'inline-block', marginTop: '4px' };

const ledgerBreakdownContainer = { display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff', border: '1px solid #eef2f6', padding: '12px', borderRadius: '16px', marginBottom: '15px' };
const ledgerMiniCard = { display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' };
const miniCardLabel = { fontSize: '10px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' };
const miniCardVal = { fontSize: '13px', fontWeight: '950', color: '#0f172a' };

const metaHeadingStyle = { display: 'flex', alignItems: 'center', gap: '6px', margin: '18px 0 8px 0', fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase' };
const metaMetricsBlock = { display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '20px', padding: '12px', border: '1px solid #eef2f6', maxHeight: '250px', overflowY: 'auto' };
const metaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc', paddingBottom: '8px', marginBottom: '8px', fontSize: '11px' };
const metaLabel = { color: '#64748b', fontWeight: 'bold' };
const metaValue = { color: '#0f172a', fontWeight: '900', textAlign: 'right' };

const amortizationCalendarBox = { maxHeight: '180px', overflowY: 'auto', background: '#fff', borderRadius: '20px', border: '1px solid #eef2f6', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' };
const calendarRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' };
const calendarIndexTag = { color: '#fff', fontSize: '9px', fontWeight: '900', padding: '3px 7px', borderRadius: '5px' };
const innerPaidBadgeStyle = { background: '#dcfce7', color: '#15803d', fontSize: '9px', fontWeight: '900', padding: '2px 6px', borderRadius: '5px' };
const innerDueBadgeStyle = { background: '#fef3c7', color: '#b45309', fontSize: '9px', fontWeight: '900', padding: '2px 6px', borderRadius: '5px' };

const printTargetBtn = { width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '14px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '15px' };

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px', flexWrap: 'wrap' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', width: '100%' };
const statCard = { background: '#fff', padding: '18px 20px', borderRadius: '20px', border: '1px solid #eef2f6' };
const labelStyle = { fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' };
const valStyle = { fontSize: '24px', fontWeight: '950', margin: '4px 0 0 0', letterSpacing: '-0.5px' };

const tableCard = { background: '#fff', borderRadius: '30px', padding: '20px', border: '1px solid #eef2f6', boxShadow: '0 10px 20px rgba(0,0,0,0.005)', overflowX: 'auto' };
const tableCardHeader = { borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' };
const tableCardTitle = { margin: 0, fontSize: '13px', fontWeight: '950', color: '#0f172a', textTransform: 'uppercase' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const tableHeader = { borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' };
const tableRow = { borderBottom: '1px solid #f8fafc', fontSize: '13px', color: '#334155' };
const idTag = { background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' };

const methodTag = (type) => ({
  fontSize: '9px', fontWeight: '900', color: type.includes('ONLINE') ? '#059669' : '#b45309', textTransform: 'uppercase', 
  border: `1px solid ${type.includes('ONLINE') ? '#a7f3d0' : '#fde68a'}`, background: type.includes('ONLINE') ? '#ecfdf5' : '#fffbeb', padding: '3px 8px', borderRadius: '6px'
});

const refreshBtn = { background: '#fff', border: '2px solid #e2e8f0', padding: '10px 18px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' };
const printSummaryBtn = { background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const loaderStyle = { textAlign: 'center', marginTop: '160px', fontWeight: '950', color: '#0f172a', fontSize: '14px' };
const emptyText = { textAlign: 'center', padding: '60px', color: '#cbd5e1', fontSize: '12px', fontWeight: 'bold' };

const printHeaderContainer = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #000000', paddingBottom: '15px', marginBottom: '20px' };
const sectionDividerTitle = { fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', background: '#000000', color: '#fff', padding: '5px 10px', margin: '20px 0 10px 0', borderRadius: '4px' };
const printTableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '10px' };
const printTableHeaderRow = { background: '#f1f5f9', borderBottom: '1px solid #000' };
const printTh = { padding: '8px 10px', fontWeight: '900', textAlign: 'left', color: '#000' };
const printTableRowStyle = { borderBottom: '1px solid #cbd5e1' };
const printTd = { padding: '8px 10px', color: '#000' };
const dossierPrintCard = { border: '2px solid #000000', borderRadius: '0px', padding: '20px', marginBottom: '20px', background: '#fff' };
const dossierPrintAvatar = { width: '55px', height: '55px', objectFit: 'cover', border: '1px solid #000' };
const printIdBadge = { border: '1px solid #000', color: '#000', fontWeight: '900', fontSize: '10px', padding: '3px 8px' };
const dossierMetaLabel = { fontSize: '8px', textTransform: 'uppercase', fontWeight: '900', color: '#000', display: 'block', marginBottom: '2px' };
const dossierMetaVal = { fontSize: '14px', fontWeight: '950', color: '#000' };

export default DailyCollectionReport;