import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { 
  FiUser, FiHome, FiCreditCard, FiCamera, 
  FiCheckCircle, FiX, FiInfo, FiImage, FiSlash, FiMaximize2, FiTrash2, FiMapPin, FiBriefcase 
} from 'react-icons/fi';

const AccountantApproval = () => {
  const [verifiedLoans, setVerifiedLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [zoomImg, setZoomImg] = useState(null); 
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || {};

  const fetchVerified = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/all-loans');
      const pendingApproval = res.data.filter(loan => 
        loan.status !== 'Rejected' && 
        loan.status !== 'Disbursed' &&
        loan.status !== 'Closed' &&
        ['Field Verified', 'Verification Pending', 'Applied'].includes(loan.status)
      );
      setVerifiedLoans(pendingApproval.reverse());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVerified(); }, [fetchVerified]);

  const handleDisburse = async (mongoId) => {
    if (!confirmTransfer) return alert("Please authorize the payment check first.");
    if (!window.confirm("Confirm: Funds have been transferred?")) return;
    try {
      const res = await API.post(`/accountant/approve/${mongoId}`);
      if (res.data.success) {
        alert("💰 DISBURSEMENT SUCCESSFUL!");
        closeModal();
        fetchVerified(); 
      }
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.error || "Sync Failed"));
    }
  };

  const handleReject = async (mongoId) => {
    const reason = window.prompt("REJECTION REASON:");
    if (!reason) return alert("Reason is mandatory.");
    try {
      await API.patch(`/loans/${mongoId}`, { status: 'Rejected', rejectionReason: reason });
      alert("🚫 LOAN REJECTED.");
      closeModal();
      fetchVerified(); 
    } catch (err) { alert("❌ Rejection Failed."); }
  };

  const handleDeleteLoan = async (mongoId) => {
    if (!window.confirm("⚠️ DANGER: PERMANENTLY DELETE THIS FILE?")) return;
    try {
      await API.delete(`/loans/${mongoId}`);
      alert("🗑️ DELETED PERMANENTLY.");
      closeModal();
      fetchVerified();
    } catch (err) { alert("❌ Delete Failed."); }
  };

  const closeModal = () => {
    setSelectedLoan(null);
    setConfirmTransfer(false);
  };

  if (loading) return <div style={loaderStyle}>🔄 ACCESSING D-FINANCE LEDGER ENGINE...</div>;

  return (
    <div style={containerStyle} className="accountant-dashboard-layout">
      <style>{responsiveCSS}</style>
      
      {/* Zoom Lightbox Preview overlay */}
      {zoomImg && (
        <div style={zoomOverlay} onClick={() => setZoomImg(null)}>
          <div style={zoomContent}>
            <FiX style={zoomClose} onClick={() => setZoomImg(null)} />
            <img src={zoomImg} style={fullImg} alt="KYC Source File" />
          </div>
        </div>
      )}

      {/* Main Terminal Header Board */}
      <div style={headerSection} className="header-resp">
        <div>
          <h2 style={mainTitle}>🛡️ Payout Authorization Tower</h2>
          <p style={subTitleText}>Secure Settlement Node | Node Executive: {user.fullName || 'Authorized Accountant'}</p>
        </div>
        <button onClick={fetchVerified} style={refreshBtn}>REFRESH QUEUE</button>
      </div>

      {/* Queue Grid Elements */}
      <div className="grid-resp" style={grid}>
        {verifiedLoans.length === 0 ? (
          <div style={noDataBox}>
            <FiCheckCircle size={45} color="#10b981" />
            <p style={{ margin: '15px 0 0 0', textTransform: 'uppercase', tracking: '1px', fontSize: '12px' }}>Operational Payout Queue Clear</p>
          </div>
        ) : (
          verifiedLoans.map(loan => (
            <div key={loan._id} style={card}>
              <div style={cardHeader}>
                <span style={idTag}>{loan.loanId}</span>
                <span style={statusBadge}>{loan.status}</span>
              </div>
              <h3 style={custNameText}>{loan.customerName}</h3>
              <div style={miniStatsBox}>
                <div><small style={miniStatsLabel}>PAYOUT Facility</small><br/><b style={{fontSize:'16px', color:'#0f172a'}}>₹{(loan.netDisbursed || loan.amount).toLocaleString('en-IN')}</b></div>
                <div style={{textAlign:'right'}}><small style={miniStatsLabel}>CYCLE TARGET</small><br/><b style={{fontSize:'16px', color:'#2563eb'}}>₹{(loan.installmentAmount || loan.dailyEMI || 0).toLocaleString('en-IN')}</b></div>
              </div>
              <button onClick={() => setSelectedLoan(loan)} style={auditBtn}>Audit Operational File</button>
            </div>
          ))
        )}
      </div>

      {/* 🔥 FIXED CORE ACCORDION MODAL OVERLAY SHEET */}
      {selectedLoan && (
        <div style={modalOverlay} className="fixed-modal-overlay-wrapper">
          <div style={modalContent} className="fixed-modal-content-container animate-slide-up">
            
            {/* Modal Header */}
            <div style={modalHeader}>
              <h3 style={{margin:0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px'}}>FILE AUDIT: {selectedLoan.loanId}</h3>
              <FiX onClick={closeModal} style={{cursor:'pointer', fontSize: '22px'}} />
            </div>

            {/* Scrollable Context Core Body */}
            <div style={modalBody} className="modal-body-scroll-engine">
              
              {/* Financial & Settlement Matrix */}
              <div style={sectionCard('#f8fafc', '#e2e8f0')}>
                <h4 style={sectionTitle}><FiCreditCard style={{color: '#2563eb'}} /> BANK RECONCILIATION DISBURSEMENT GATEWAY</h4>
                <div className="info-grid-resp" style={infoGrid}>
                  <DataField label="Account Holder legal name" value={selectedLoan.accountHolderName} />
                  <DataField label="Bank Institution String" value={selectedLoan.bankName} />
                  <DataField label="Account Registry No." value={selectedLoan.accountNumber} highlight />
                  <DataField label="IFSC Routing Code" value={selectedLoan.ifscCode} highlight />
                  <DataField label="Net In-Hand Disbursement" value={`₹${(selectedLoan.netDisbursed || selectedLoan.amount).toLocaleString('en-IN')}`} highlight />
                </div>
              </div>

              {/* On-Site Verification Insights */}
              <div style={sectionCard('#f8fafc', '#e2e8f0')}>
                <h4 style={sectionTitle}><FiMapPin style={{color: '#d97706'}} /> FIELD VERIFICATION REPORT SUMMARY (LUC)</h4>
                <div className="info-grid-resp" style={infoGrid}>
                  <DataField label="Asset Household Structure" value={selectedLoan.houseType} />
                  <DataField label="Evaluated Monthly Income" value={`₹${Number(selectedLoan.monthlyIncome || 0).toLocaleString('en-IN')}`} />
                  <DataField label="Auditing Officer Signature Node" value={selectedLoan.verifiedByName} />
                  <DataField label="Physical Infrastructure Coordinates" value={selectedLoan.locationName} />
                </div>
              </div>

              {/* Bound Nominee Identity Framework */}
              <div style={sectionCard('#f8fafc', '#e2e8f0')}>
                <h4 style={sectionTitle}><FiUser style={{color: '#475569'}} /> ATTACHED FAMILY NOMINEE CREDENTIALS</h4>
                <div className="info-grid-resp" style={infoGrid}>
                  <DataField label="Nominee Full Name" value={selectedLoan.nomineeName} />
                  <DataField label="Bound Relationship Structure" value={selectedLoan.nomineeRelation} />
                  <DataField label="Primary Contact Number" value={selectedLoan.nomineeMobile} />
                </div>
              </div>

              {/* Vault Evidence Grid Sheet */}
              <div style={sectionCard('#fff', '#e2e8f0')}>
                <h4 style={sectionTitle}><FiCamera style={{color: '#0f172a'}} /> HARDWARE CAPTURED DIGITAL EVIDENCE VAULT</h4>
                <div style={imageScroll} className="scroll-resp">
                  <DocThumbnail label="Live Customer Snapshot" src={selectedLoan.custLivePhoto} onZoom={setZoomImg} />
                  <DocThumbnail label="Aadhar Document Card Front" src={selectedLoan.custAadhaarFront} onZoom={setZoomImg} />
                  <DocThumbnail label="Aadhar Document Card Back" src={selectedLoan.custAadhaarBack} onZoom={setZoomImg} />
                  <DocThumbnail label="Voter ID Card Front" src={selectedLoan.custVoterFront} onZoom={setZoomImg} />
                  <DocThumbnail label="Wet Ink Signature" src={selectedLoan.custSignature} onZoom={setZoomImg} />
                  <DocThumbnail label="Nominee Portrait Passport" src={selectedLoan.nomineePic} onZoom={setZoomImg} />
                  <DocThumbnail label="Passbook Statement" src={selectedLoan.passbookPic} onZoom={setZoomImg} />
                </div>
              </div>
            </div>

            {/* Modal Settlement Control Operations Section */}
            <div style={modalFooter}>
              <div style={actionRow}>
                <label style={checkboxLabel}>
                  <input type="checkbox" style={{cursor:'pointer', width:'16px', height:'16px', shrink: 0}} checked={confirmTransfer} onChange={(e) => setConfirmTransfer(e.target.checked)} />
                  <span style={{fontSize: '11px', fontWeight: '800', lineHeight: '1.4'}}>I authorize that the bank payment wire has been verified & successfully pushed from net banking.</span>
                </label>
              </div>
              <div style={footerButtons} className="btn-group-resp">
                <button onClick={() => handleDeleteLoan(selectedLoan._id)} style={deleteBtn}>Purge</button>
                <button onClick={() => handleReject(selectedLoan._id)} style={rejectBtn}><FiSlash/> Decline</button>
                <button 
                  onClick={() => handleDisburse(selectedLoan._id)} 
                  disabled={!confirmTransfer} 
                  style={confirmTransfer ? disburseBtn : disabledBtn}
                >
                  <FiCheckCircle/> Release Capital
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// UI Stateless Render Components
const DataField = ({ label, value, highlight }) => (
  <div style={{minWidth: '100px', marginBottom: '5px'}}>
    <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', tracking: '0.5px' }}>{label}</p>
    <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 800, color: highlight ? '#2563eb' : '#0f172a', wordBreak: 'break-word' }}>{value || 'N/A'}</p>
  </div>
);

const DocThumbnail = ({ label, src, onZoom }) => (
  <div style={thumbContainer} onClick={() => src && onZoom(src)}>
    <p style={{fontSize: '8px', fontWeight: 900, textAlign: 'center', marginBottom: '6px', color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{label}</p>
    {src ? (
      <div style={imgWrapper}>
        <img src={src} style={thumbImg} alt="Kyc Record Snapshot" />
        <div style={zoomBadge}><FiMaximize2 size={10}/></div>
      </div>
    ) : (
      <div style={noImg}>EMPTY NODE</div>
    )}
  </div>
);

// --- CSS CONFIGURATIONS & COMPONENT OVERRIDES ---
const containerStyle = { padding: '25px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', boxSizing: 'border-box' };
const headerSection = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', gap: '15px' };
const mainTitle = { color: '#0f172a', fontWeight: 950, fontSize: '24px', tracking: '-0.5px', margin: 0 };
const subTitleText = { fontSize: '12px', color: '#64748b', fontWeight: 'bold', margin: '4px 0 0 0' };
const refreshBtn = { background: '#0f172a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', tracking: '0.5px', cursor: 'pointer' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' };
const card = { background: '#fff', padding: '25px', borderRadius: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', boxSizing: 'border-box' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const idTag = { background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', fontStyle: 'monospace' };
const statusBadge = { background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' };
const custNameText = { fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 15px 0', tracking: '-0.5px' };
const miniStatsBox = { display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '16px', marginBottom: '20px', border: '1px solid #f1f5f9' };
const miniStatsLabel = { fontSize: '9px', fontColor: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', tracking: '0.5px' };
const auditBtn = { width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', tracking: '0.5px', cursor: 'pointer' };

// 🔥 CRITICAL FIXED POSITION LAYOUT FOR POPUP MODALS OVERRIDES
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px', backdropFilter: 'blur(6px)', boxSizing: 'border-box' };
const modalContent = { background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', boxSizing: 'border-box' };
const modalHeader = { padding: '18px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 };
const modalBody = { padding: '20px 24px', overflowY: 'auto', flex: '1 1 auto', background: '#ffffff' };
const modalFooter = { padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexShrink: 0 };

const sectionCard = (bg, border) => ({ background: '#fff', padding: '18px', borderRadius: '18px', marginBottom: '15px', border: '1px solid #e2e8f0', boxSizing: 'border-box' });
const sectionTitle = { fontSize: '11px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#1e293b', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', textTransform: 'uppercase', tracking: '0.5px' };
const infoGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' };
const imageScroll = { display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '10px' };
const thumbContainer = { flex: '0 0 115px', minWidth: '0', cursor: 'pointer' };
const imgWrapper = { position: 'relative', height: '85px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #e2e8f0' };
const thumbImg = { width: '100%', height: '100%', objectFit: 'cover' };
const zoomBadge = { position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(15,23,42,0.6)', color: '#fff', padding: '4px', borderRadius: '6px' };

const actionRow = { marginBottom: '15px', padding: '14px', background: '#ecfdf5', borderRadius: '14px', border: '1px solid #a7f3d0' };
const checkboxLabel = { display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#065f46', cursor: 'pointer' };
const footerButtons = { display: 'flex', gap: '10px', width: '100%' };

const disburseBtn = { flex: '2 1 0%', padding: '15px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', textTransform: 'uppercase', tracking: '0.5px' };
const disabledBtn = { ...disburseBtn, background: '#cbd5e1', color: '#94a3b8', cursor: 'not-allowed', boxShadow: 'none' };
const rejectBtn = { flex: '1 1 0%', padding: '15px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', tracking: '0.5px', cursor: 'pointer' };
const deleteBtn = { padding: '15px 20px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '14px', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer' };

const zoomOverlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.96)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' };
const zoomContent = { position: 'relative', width: '100%', maxWidth: '720px', display: 'flex', justifyContent: 'center' };
const fullImg = { width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '16px' };
const zoomClose = { position: 'absolute', top: '-45px', right: '0', color: '#fff', fontSize: '32px', cursor: 'pointer' };
const noImg = { height: '85px', background: '#f1f5f9', color: '#94a3b8', borderRadius: '14px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '900' };
const noDataBox = { gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#94a3b8', background: '#fff', borderRadius: '32px', border: '1px dashed #cbd5e1' };
const loaderStyle = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', color: '#475569', tracking: '1px', background: '#f8fafc' };

// Global layout dynamic response modifiers injections
const responsiveCSS = `
  .accountant-dashboard-layout { padding-left: 20px !important; width: 100%; box-sizing: border-box; }
  .fixed-modal-overlay-wrapper { left: 0 !important; width: 100vw !important; height: 100vh !important; }
  .fixed-modal-content-container { margin-left: auto; margin-right: auto; }
  @media (max-width: 768px) {
    .header-resp { flex-direction: column; align-items: flex-start !important; gap: 15px !important; }
    .header-resp button { width: 100% !important; }
    .grid-resp { grid-template-columns: 1fr !important; }
    .info-grid-resp { grid-template-columns: 1fr !important; gap: 12px !important; }
    .btn-group-resp { flex-direction: column !important; width: 100% !important; }
    .btn-group-resp button { width: 100% !important; margin-bottom: 2px; }
  }
  .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
`;

export default AccountantApproval;