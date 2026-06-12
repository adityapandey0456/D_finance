import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { 
  FiPrinter, FiUser, FiInfo, FiClock, FiRefreshCw, FiMapPin, FiCheckCircle
} from 'react-icons/fi';

const CustomerReport = () => {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user')) || {};

  const fetchMyData = useCallback(async () => {
    if (!user.id && !user._id) return;
    setLoading(true);
    try {
      const cId = user.id || user._id;
      // 🔥 SECURITY: Fetching STRICTLY for the logged-in customer ID
      const [loanRes, payRes] = await Promise.all([
        API.get(`/loans?customerId=${cId}`),
        API.get(`/payments?customerId=${cId}`)
      ]);

      const myLoans = Array.isArray(loanRes.data) ? loanRes.data : [];
      setLoans(myLoans);
      setPayments(Array.isArray(payRes.data) ? payRes.data : []);

    } catch (err) {
      console.error("Failed to fetch customer profile data:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id, user._id]);

  useEffect(() => {
    fetchMyData();
  }, [fetchMyData]);

  const handlePrintAction = () => {
    setTimeout(() => { window.print(); }, 150);
  };

  const maskIdentityString = (idValue) => {
    if (!idValue) return "N/A";
    const str = String(idValue).trim();
    if (str.length <= 4) return "XXXX-XXXX";
    return `XXXX-XXXX-${str.slice(-4)}`;
  };

  if (loading) return <div style={loaderStyle}>SYNCING YOUR SECURE PROFILE...</div>;

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
      .no-print { display: none !important; }
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
    }
  `;

  return (
    <div style={masterPageStyle}>
      <style>{printStyles}</style>

      {/* =========================================================================
          1️⃣ ACTIONS HEADER BAR (Screen Only)
         ========================================================================= */}
      <div className="no-print" style={headerStyle}>
        <div>
          <h2 style={titleStyles}>📋 MY LOAN STATEMENT</h2>
          <p style={subStyles}>View your complete profile, KYC, and EMI schedule.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchMyData} style={refreshBtn}>
            <FiRefreshCw /> Resync Data
          </button>
          <button onClick={handlePrintAction} style={printSummaryBtn}>
            <FiPrinter /> Download / Print Report
          </button>
        </div>
      </div>

      {/* =========================================================================
          2️⃣ SCREEN VIEW (Interactive Customer Profile View)
         ========================================================================= */}
      <div className="no-print">
        {loans.length > 0 ? loans.map((loan) => (
          <div key={loan._id} style={profileCardPane}>
            
            {/* PROFILE IMAGE & BASIC INFO */}
            <div style={profileHeader}>
              <img 
                src={loan.custLivePhoto || user?.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt="My Profile" 
                style={sidebarAvatarStyle}
                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
              />
              <div>
                <h4 style={customerNameStyle}>{loan.customerName}</h4>
                <span style={miniFileIdBadge}>LOAN ID: {loan.loanId}</span>
                <span style={{...miniFileIdBadge, background: loan.status === 'Disbursed' ? '#10b981' : '#f59e0b', marginLeft: '8px'}}>
                  {loan.status?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* BALANCE METRICS */}
            <div style={ledgerBreakdownContainer}>
              <div style={ledgerMiniCard}><span>Sanctioned Principal</span><strong>₹{Number(loan.amount || 0).toLocaleString('en-IN')}</strong></div>
              <div style={ledgerMiniCard}><span>Total Repaid</span><strong style={{ color: '#10b981' }}>₹{Number(loan.totalPaid || 0).toLocaleString('en-IN')}</strong></div>
              <div style={{...ledgerMiniCard, borderBottom: 'none', paddingBottom: 0}}><span>Remaining Dues</span><strong style={{ color: '#f43f5e' }}>₹{Number(loan.totalPending || 0).toLocaleString('en-IN')}</strong></div>
            </div>

            {/* COMPREHENSIVE DETAILS GRID */}
            <div style={metaHeadingStyle}><FiInfo /> My Submitted Application Details</div>
            <div style={metaMetricsBlock}>
              <div style={metaRow}><span>Nominee Name</span><span style={metaValue}>{loan.nomineeName || 'N/A'}</span></div>
              <div style={metaRow}><span>Nominee Relation</span><span style={metaValue}>{loan.nomineeRelation || 'N/A'}</span></div>
              <div style={metaRow}><span>Nominee Contact</span><span style={metaValue}>{loan.nomineeMobile || 'N/A'}</span></div>
              <div style={metaRow}><span>Aadhaar Number</span><span style={metaValue}>{maskIdentityString(loan.aadhaar)}</span></div>
              <div style={metaRow}><span>Settlement Bank</span><span style={metaValue}>{loan.bankName || 'N/A'}</span></div>
              <div style={metaRow}><span>Account Number</span><span style={metaValue}>{loan.accountNumber || 'N/A'}</span></div>
              <div style={metaRow}><span>IFSC Code</span><span style={{ ...metaValue, textTransform: 'uppercase' }}>{loan.ifscCode || 'N/A'}</span></div>
              <div style={metaRow}><span>Area Type</span><span style={metaValue}>{loan.areaType || 'N/A'}</span></div>
              <div style={metaRow}><span>Residence Status</span><span style={metaValue}>{loan.residenceNature || 'N/A'}</span></div>
              <div style={metaRow}><span>Structure Build</span><span style={metaValue}>{loan.houseType || 'N/A'}</span></div>
              <div style={metaRow}><span>Years of Stay</span><span style={metaValue}>{loan.houseStay || '0'} Yrs</span></div>
              <div style={metaRow}><span>Occupation</span><span style={metaValue}>{loan.memberOccupation || 'N/A'}</span></div>
              <div style={metaRow}><span>Monthly Income</span><span style={metaValue}>₹{Number(loan.monthlyIncome || 0).toLocaleString('en-IN')}</span></div>
              <div style={{ ...metaRow, border: 'none', paddingBottom: 0, marginBottom: 0 }}><span>Verified Location</span><span style={{ ...metaValue, fontSize: '10px', maxWidth: '200px', wordBreak: 'break-word', display: 'block' }}>{loan.locationName || 'N/A'}</span></div>
            </div>

            {/* EMI SCHEDULE MATRIX */}
            <div style={metaHeadingStyle}><FiClock /> My EMI Amortization Schedule</div>
            <div style={amortizationCalendarBox}>
              {Array.from({ length: Number(loan.totalInstallments) || 1 }).map((_, idx) => {
                const numberInst = idx + 1;
                const emiVal = Number(loan.installmentAmount || 0);
                const checkPaid = Number(loan.totalPaid || 0) >= (numberInst * emiVal);
                
                let emiDateObj = new Date(loan.appliedDate?.$date || loan.appliedDate || Date.now());
                if (isNaN(emiDateObj.getTime())) emiDateObj = new Date();

                if (loan.emiType === 'Weekly EMI') {
                  emiDateObj.setDate(emiDateObj.getDate() + (numberInst * 7));
                } else {
                  emiDateObj.setDate(emiDateObj.getDate() + numberInst);
                }

                return (
                  <div key={numberInst} style={calendarRow}>
                    <span style={{ ...calendarIndexTag, background: checkPaid ? '#64748b' : '#2563eb' }}>Inst-{numberInst}</span>
                    <div style={{ flex: 1, paddingLeft: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>₹{emiVal.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>📅 Due on: {emiDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <span style={checkPaid ? innerPaidBadgeStyle : innerDueBadgeStyle}>{checkPaid ? "✓ PAID" : "⏳ DUE"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )) : (
          <div style={emptySidebarPlaceholder}>No active loan profile found. Please apply for a loan to see your details.</div>
        )}
      </div>

      {/* =========================================================================
          3️⃣ PRINT DOSSIER (Visible only during PDF Generation/Print)
         ========================================================================= */}
      <div className="print-dossier" style={{ display: 'none' }}>
        
        {/* PRAYAGRAJ HEADER */}
        <div style={printHeaderContainer}>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: '0 0 3px 0', fontWeight: '950', letterSpacing: '-1.5px', fontSize: '24px', color: '#0f172a' }}>D-FINANCE SOLUTIONS</h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#334155', fontWeight: '900', textTransform: 'uppercase' }}>Central Corporate Node: Prayagraj Branch, UP</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>Official Customer Master Ledger & Statement</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.4' }}>
            <div>Statement Generation Date: {new Date().toLocaleDateString('en-IN')}</div>
            <div>Secure System Verification: Valid</div>
          </div>
        </div>

        {loans.map((loan, index) => (
          <div key={index} className="dossier-print-card-layout">
            
            {/* Header Profile */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '12px', marginBottom: '15px' }}>
              <img 
                src={loan.custLivePhoto || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                alt="My KYC Photo" 
                style={dossierPrintAvatar}
                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
              />
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '950', textTransform: 'uppercase', color: '#000000' }}>
                  {loan.customerName}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px', fontSize: '10px', color: '#000000' }}>
                  <div><strong>Aadhaar No:</strong> {maskIdentityString(loan.aadhaar)}</div>
                  <div><strong>Nominee Name:</strong> {loan.nomineeName || 'N/A'}</div>
                  <div><strong>Nominee Relation:</strong> {loan.nomineeRelation || 'N/A'}</div>
                  <div><strong>Nominee Contact:</strong> {loan.nomineeMobile || 'N/A'}</div>
                  <div><strong>Verified By (Officer):</strong> {loan.verifiedByName || 'System Node'}</div>
                  <div><strong>Mobile Number:</strong> {loan.customerMobile || user?.mobile || 'N/A'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={printIdBadge}>FILE ID: {loan.loanId}</span>
                <div style={{ fontSize: '9px', marginTop: '6px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000' }}>
                  Loan Status: {loan.status}
                </div>
              </div>
            </div>

            {/* Details Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', fontSize: '10px', marginBottom: '15px', borderBottom: '1px dashed #000000', paddingBottom: '10px', color: '#000000' }}>
              <div><strong>Demographics:</strong> {loan.areaType || 'N/A'}</div>
              <div><strong>Residence:</strong> {loan.residenceNature || 'N/A'}</div>
              <div><strong>Build Type:</strong> {loan.houseType || 'N/A'}</div>
              <div><strong>Rooms:</strong> {loan.noOfRooms || 'N/A'}</div>
              <div><strong>Members:</strong> {loan.noOfMembers || 'N/A'}</div>
              <div><strong>Stay Years:</strong> {loan.houseStay || '0'} Yrs</div>
              <div><strong>Earning Members:</strong> {loan.earningMembers || '0'}</div>
              <div><strong>Occupation:</strong> {loan.memberOccupation || 'N/A'}</div>
              <div><strong>Monthly Yield:</strong> ₹{Number(loan.monthlyIncome || 0).toLocaleString('en-IN')}</div>
              <div><strong>Networth:</strong> ₹{Number(loan.networth || 0).toLocaleString('en-IN')}</div>
              <div><strong>Livestock:</strong> {loan.cows || '0'}</div>
              <div><strong>Water Source:</strong> {loan.drinkingWater || 'N/A'}</div>
            </div>

            {/* Bank Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '10px', marginBottom: '15px', borderBottom: '1px dashed #000000', paddingBottom: '10px', color: '#000000' }}>
              <div><strong>Settlement Bank:</strong> {loan.bankName || 'N/A'}</div>
              <div><strong>Account Number:</strong> {loan.accountNumber || 'N/A'}</div>
              <div><strong>IFSC Branch Code:</strong> {String(loan.ifscCode).toUpperCase() || 'N/A'}</div>
            </div>

            <div style={{ fontSize: '9px', color: '#000000', marginBottom: '15px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              📍 <strong>Verified Geolocation Base:</strong> {loan.locationName || 'N/A'}
            </div>

            {/* Summary Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', padding: '10px 15px', border: '1px solid #000000', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
              <div>
                <span style={dossierMetaLabel}>Total Principal Value</span>
                <div style={dossierMetaVal}>₹{Number(loan.amount || 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style={dossierMetaLabel}>Total Cleared EMIs</span>
                <div style={dossierMetaVal}>₹{Number(loan.totalPaid || 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style={dossierMetaLabel}>Remaining Dues Liability</span>
                <div style={dossierMetaVal}>₹{Number(loan.totalPending || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* EMI SCHEDULE MATRIX (PRINT) */}
            <div style={{ marginTop: '20px', pageBreakInside: 'auto' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '950', borderBottom: '1px solid #000000', paddingBottom: '4px', textTransform: 'uppercase', color: '#000000', letterSpacing: '0.3px' }}>
                My Repayment Schedule
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

            {/* SIGNATURE BLOCKS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', paddingTop: '15px', borderTop: '1px dashed #000000', pageBreakInside: 'avoid' }}>
              <div style={{ textAlign: 'center', width: '30%' }}>
                <div style={{ borderBottom: '1px solid #000000', width: '85%', margin: '0 auto 6px auto', height: '35px' }}></div>
                <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', color: '#000000' }}>Client Signature (Me)</span>
              </div>
              <div style={{ textAlign: 'center', width: '30%' }}>
                <div style={{ borderBottom: '1px solid #000000', width: '85%', margin: '0 auto 6px auto', height: '35px' }}></div>
                <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', color: '#000000' }}>Field Advisor</span>
              </div>
              <div style={{ textAlign: 'center', width: '30%' }}>
                <div style={{ borderBottom: '1px solid #000000', width: '85%', margin: '0 auto 6px auto', height: '35px' }}></div>
                <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', color: '#000000' }}>Branch Manager</span>
              </div>
            </div>

            {/* IMAGE EVIDENCE VAULT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginTop: '25px', pageBreakInside: 'avoid' }}>
              {loan.passbookPic && (
                <div>
                  <span style={dossierMetaLabel}>My Passbook/Cheque Proof</span>
                  <img src={loan.passbookPic} alt="Passbook Evidence" style={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #000' }} />
                </div>
              )}
              {loan.custAadhaarBack ? (
                <div>
                  <span style={dossierMetaLabel}>Aadhaar Back Attachment</span>
                  <img src={loan.custAadhaarBack} alt="Aadhaar Back" style={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #000' }} />
                </div>
              ) : null}
              {loan.custAadhaarFront ? (
                <div>
                  <span style={dossierMetaLabel}>Aadhaar Front Check</span>
                  <img src={loan.custAadhaarFront} alt="Aadhaar Front" style={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #000' }} />
                </div>
              ) : null}
              {loan.nomineePic ? (
                <div>
                  <span style={dossierMetaLabel}>Nominee Verification Asset</span>
                  <img src={loan.nomineePic} alt="Nominee Photo" style={{ width: '100%', maxHeight: '75px', objectFit: 'contain', border: '1px solid #000' }} />
                </div>
              ) : null}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

// =========================================================================
// STYLING MAP HOOKS Blueprints
// =========================================================================
const masterPageStyle = { padding: '20px 3%', background: '#f8fafc', minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px', flexWrap: 'wrap' };
const titleStyles = { margin: 0, fontWeight: 950, fontSize: '24px', color: '#0f172a', letterSpacing: '-1px' };
const subStyles = { margin: '4px 0 0 0', color: '#64748b', fontSize: '13px', fontWeight: '600' };

const refreshBtn = { background: '#fff', border: '2px solid #e2e8f0', padding: '10px 18px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' };
const printSummaryBtn = { background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 15px rgba(37, 99, 235, 0.2)' };

const profileCardPane = { background: '#fff', border: '1px solid #eef2f6', borderRadius: '24px', padding: '25px', boxSizing: 'border-box', marginTop: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', maxWidth: '900px', margin: '0 auto' };
const profileHeader = { display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '18px', marginBottom: '18px' };
const sidebarAvatarStyle = { width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f8fafc', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' };
const customerNameStyle = { margin: 0, fontSize: '18px', fontWeight: '950', color: '#0f172a', textTransform: 'uppercase' };
const miniFileIdBadge = { background: '#0f172a', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginTop: '6px' };

const ledgerBreakdownContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', background: '#f8fafc', border: '1px solid #eef2f6', padding: '18px', borderRadius: '18px', marginBottom: '25px' };
const ledgerMiniCard = { display: 'flex', flexDirection: 'column', gap: '6px' };

const metaHeadingStyle = { display: 'flex', alignItems: 'center', gap: '8px', margin: '25px 0 12px 0', fontSize: '13px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' };
const metaMetricsBlock = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #eef2f6' };
const metaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc', paddingBottom: '8px', fontSize: '12px' };
const metaLabel = { color: '#64748b', fontWeight: 'bold' };
const metaValue = { color: '#0f172a', fontWeight: '900', textAlign: 'right' };

const amortizationCalendarBox = { maxHeight: '350px', overflowY: 'auto', background: '#fff', borderRadius: '20px', border: '1px solid #eef2f6', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' };
const calendarRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' };
const calendarIndexTag = { color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px' };
const innerPaidBadgeStyle = { background: '#dcfce7', color: '#15803d', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px' };
const innerDueBadgeStyle = { background: '#fef3c7', color: '#b45309', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px' };

const emptySidebarPlaceholder = { textAlign: 'center', padding: '80px 20px', background: '#fff', border: '2px dashed #cbd5e1', borderRadius: '24px', fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' };
const loaderStyle = { textAlign: 'center', marginTop: '160px', fontWeight: '950', color: '#0f172a', fontSize: '14px' };

const printHeaderContainer = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #000000', paddingBottom: '15px', marginBottom: '20px' };
const printIdBadge = { border: '1px solid #000', color: '#000', fontWeight: '900', fontSize: '10px', padding: '3px 8px' };
const dossierPrintAvatar = { width: '55px', height: '55px', objectFit: 'cover', border: '1px solid #000' };
const dossierMetaLabel = { fontSize: '8px', textTransform: 'uppercase', fontWeight: '900', color: '#000', display: 'block', marginBottom: '2px' };
const dossierMetaVal = { fontSize: '14px', fontWeight: '950', color: '#000' };

export default CustomerReport;