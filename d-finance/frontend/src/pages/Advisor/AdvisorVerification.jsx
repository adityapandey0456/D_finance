import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../../api/axios';
import { 
  FiCamera, FiX, FiUser, FiHome, FiShield, FiBriefcase, 
  FiCreditCard, FiMapPin, FiInfo, FiUsers, FiPhone, FiArrowRight, FiArrowLeft
} from 'react-icons/fi';

const AdvisorVerification = () => {
  const [myPendingLoans, setMyPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [addressName, setAddressName] = useState('Detecting location...');
  const [step, setStep] = useState(1);
  
  // Custom Live Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [activeCameraField, setActiveCameraField] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [fieldForm, setFieldForm] = useState({
    religion: 'HINDU', category: 'GENERAL', houseType: 'CONCRETE', areaType: 'RURAL', residenceNature: 'Owned',
    monthlyIncome: '', expenditure: '', familyIncomeActivities: 'Business', memberOccupation: '', 
    nomineeName: '', nomineeDOB: '', nomineeAge: '', nomineeGender: 'MALE', nomineeUID: '', nomineeVoterId: '', nomineeMobile: '', 
    nomineeRelation: 'SPOUSE', nomineeAddress: '', nomineeCategory: 'GENERAL',
    
    custLivePhoto: '', custAadhaarFront: '', custAadhaarBack: '', custVoterFront: '',   
    custSignature: '', nomineePic: '', passbookPic: '', secondaryIdBack: '',
    ifscCode: '', bankAccountNumber: '', confirmAccountNumber: '', accountHolderName: '', customerMobile: '', loanId: '', customerId: '',
    locationName: ''
  });

  const currentAdvisor = JSON.parse(localStorage.getItem('user')) || {};

  const getPlaceName = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const place = data.display_name || "Location Captured";
      setAddressName(place);
      setFieldForm(prev => ({ ...prev, locationName: place }));
    } catch (error) {
      setAddressName("Location captured (Address fetch failed)");
    }
  };

  const handleOpenForm = (loan) => {
    setSelectedLoan(loan);
    setStep(1); 
    setFieldForm(prev => ({
      ...prev,
      accountHolderName: loan.accountHolderName || '',
      ifscCode: loan.ifscCode || '',
      bankAccountNumber: loan.accountNumber || '',
      confirmAccountNumber: loan.accountNumber || '',
      customerMobile: loan.customerMobile || loan.mobile || '',
      loanId: loan.loanId || '',
      customerId: loan.customerId || '',
      houseType: loan.houseType || 'CONCRETE',
      areaType: loan.areaType || 'RURAL'
    }));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        getPlaceName(pos.coords.latitude, pos.coords.longitude);
      });
    }
  };

  const fetchMyRequests = useCallback(async () => {
    if (!currentAdvisor.id && !currentAdvisor._id) return;
    setLoading(true);
    try {
      const res = await API.get(`/loans?status=Verification Pending&sponsorId=${currentAdvisor.id || currentAdvisor._id}`);
      setMyPendingLoans(res.data.reverse());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [currentAdvisor.id, currentAdvisor._id]);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  // 🔥 CUSTOM CAMERA HARDWARE HANDLERS
  const startCamera = async (field) => {
    setActiveCameraField(field);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, 
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Access Error: ", err);
      alert("❌ Camera open nahi ho paya. Device settings mein parameters permissions check karein.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    setActiveCameraField(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const base64Image = canvas.toDataURL('image/jpeg');
      setFieldForm(prev => ({ ...prev, [activeCameraField]: base64Image }));
      stopCamera();
    }
  };

  const handleSOPSubmit = async () => {
    if (!fieldForm.custLivePhoto || !fieldForm.custAadhaarFront || !fieldForm.custSignature) {
      return alert("⚠️ Error: Please capture all mandatory photos (Customer, Aadhar, Signature) before submission.");
    }

    setLoading(true);
    const finalPayload = {
      ...fieldForm,
      status: "Field Verified",
      inspectionDate: new Date().toISOString(),
      advisorId: currentAdvisor.id || currentAdvisor._id,
      verifiedByName: currentAdvisor.fullName
    };

    try {
      await API.patch(`/loans/${selectedLoan._id || selectedLoan.id}`, finalPayload);
      alert("✅ Data & KYC Evidence Synced to Mainframe!");
      setSelectedLoan(null);
      fetchMyRequests();
    } catch (err) { 
        alert("❌ Submission Failed. Check network connection."); 
    } finally { 
        setLoading(false); 
    }
  };

  const nextStep = (e) => {
    e.preventDefault();
    setStep(prev => prev + 1);
  };

  const prevStep = (e) => {
    e.preventDefault();
    setStep(prev => prev - 1);
  };

  return (
    <div style={containerStyle}>
      <style>{responsiveCSS}</style>
      <div style={headerSection}>
        <h2 style={mainTitle}>🛡️ FIELD AUDIT TERMINAL</h2>
        <p style={subTitle}>Officer: <b>{currentAdvisor?.fullName}</b></p>
      </div>
      
      {!selectedLoan ? (
        loading ? <div style={statusMsg}>🔄 Connecting...</div> :
        <div className="card-grid" style={gridContainer}>
          {myPendingLoans.map(loan => (
            <div key={loan._id} style={verifyCard}>
              <div style={cardBadge}>LUC PENDING</div>
              <h4 style={custName}>{loan.customerName}</h4>
              <p style={loanAmt}>₹{loan.amount.toLocaleString()}</p>
              <div style={miniInfo}>ID: {loan.loanId}</div>
              <button onClick={() => handleOpenForm(loan)} style={verifyBtn}>Conduct Visit</button>
            </div>
          ))}
          {myPendingLoans.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', fontSize: '13px', padding: '40px 0' }}>NO PENDING FILES FOUND</p>
          )}
        </div>
      ) : (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <div>
                 <span style={{fontSize:'10px'}}>PAGE {step} / 3</span>
                 <h3 style={{ margin: 0 }}>{selectedLoan.customerName}</h3>
              </div>
              <FiX onClick={() => setSelectedLoan(null)} style={{cursor:'pointer', fontSize:'22px'}} />
            </div>

            <div style={stepperBar}>
                <div style={{...stepDot, background: step >= 1 ? '#2563eb' : '#e2e8f0'}}></div>
                <div style={{...stepLine, background: step >= 2 ? '#2563eb' : '#e2e8f0'}}></div>
                <div style={{...stepDot, background: step >= 2 ? '#2563eb' : '#e2e8f0'}}></div>
                <div style={{...stepLine, background: step >= 3 ? '#2563eb' : '#e2e8f0'}}></div>
                <div style={{...stepDot, background: step >= 3 ? '#2563eb' : '#e2e8f0'}}></div>
            </div>
            
            <div style={formScroll}>
              {step === 1 && (
                <div className="animate-fade">
                    <h4 style={sectionTitle}><FiHome /> 1. Profile & Income</h4>
                    <div className="resp-grid" style={formGrid}>
                        <SelectField label="House Type *" options={['CONCRETE', 'KUTCHA', 'TILED', 'HUT']} value={fieldForm.houseType} onChange={v => setFieldForm({...fieldForm, houseType: v})} />
                        <SelectField label="Area Type *" options={['RURAL', 'URBAN', 'SEMI-URBAN']} value={fieldForm.areaType} onChange={v => setFieldForm({...fieldForm, areaType: v})} />
                        <InputField label="Monthly Income *" type="number" value={fieldForm.monthlyIncome} onChange={v => setFieldForm({...fieldForm, monthlyIncome: v})} />
                        <InputField label="Occupation *" value={fieldForm.memberOccupation} onChange={v => setFieldForm({...fieldForm, memberOccupation: v})} />
                    </div>
                    <h4 style={sectionTitle}><FiShield /> 4. Bank Account Verification</h4>
                    <div className="resp-grid" style={formGrid}>
                        <InputField label="A/C Holder" value={fieldForm.accountHolderName} readOnly />
                        <InputField label="A/C Number" value={fieldForm.bankAccountNumber} readOnly />
                    </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade">
                    <h4 style={sectionTitle}><FiUsers /> 2. Nominee Details</h4>
                    <div className="resp-grid" style={formGrid}>
                        <InputField label="Nominee Name *" value={fieldForm.nomineeName} onChange={v => setFieldForm({...fieldForm, nomineeName: v})} />
                        <InputField label="Nominee Mobile *" type="number" value={fieldForm.nomineeMobile} onChange={v => setFieldForm({...fieldForm, nomineeMobile: v})} />
                        <InputField label="Nominee UID *" type="number" value={fieldForm.nomineeUID} onChange={v => setFieldForm({...fieldForm, nomineeUID: v})} />
                        <SelectField label="Relationship *" options={['SPOUSE', 'FATHER', 'MOTHER', 'SON', 'DAUGHTER', 'BROTHER']} value={fieldForm.nomineeRelation} onChange={v => setFieldForm({...fieldForm, nomineeRelation: v})} />
                    </div>
                </div>
              )}

              {/* PAGE 3: KYC EVIDENCE */}
              {step === 3 && (
                <div className="animate-fade">
                    <h4 style={sectionTitle}><FiCamera /> 3. KYC Evidence</h4>
                    <div className="doc-resp-grid" style={docGrid}>
                        <CaptureBox label="Customer Photo *" field="custLivePhoto" value={fieldForm.custLivePhoto} onStartCamera={startCamera} />
                        <CaptureBox label="Aadhar Front *" field="custAadhaarFront" value={fieldForm.custAadhaarFront} onStartCamera={startCamera} />
                        <CaptureBox label="Aadhar Back *" field="custAadhaarBack" value={fieldForm.custAadhaarBack} onStartCamera={startCamera} />
                        <CaptureBox label="Voter/PAN" field="custVoterFront" value={fieldForm.custVoterFront} onStartCamera={startCamera} />
                        <CaptureBox label="Signature *" field="custSignature" value={fieldForm.custSignature} onStartCamera={startCamera} />
                        <CaptureBox label="Nominee Pic" field="nomineePic" value={fieldForm.nomineePic} onStartCamera={startCamera} />
                        <CaptureBox label="Passbook" field="passbookPic" value={fieldForm.passbookPic} onStartCamera={startCamera} />
                    </div>
                </div>
              )}
              
              <div style={footerAction}>
                {step > 1 ? (
                    <button type="button" onClick={prevStep} style={cancelBtn}>BACK</button>
                ) : (
                    <button type="button" onClick={() => setSelectedLoan(null)} style={cancelBtn}>CANCEL</button>
                )}

                {step < 3 ? (
                    <button type="button" onClick={nextStep} style={submitBtn}>CONTINUE <FiArrowRight /></button>
                ) : (
                    <button type="button" onClick={handleSOPSubmit} disabled={loading} style={submitBtn}>
                        {loading ? 'SYNCING...' : 'FINALIZE AUDIT'}
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 OVERLAY MODEL FOR IN-BROWSER SECURE LIVE WEBCAM FEED */}
      {cameraActive && (
        <div style={camModalOverlay}>
          <div style={camModalContent}>
            <div style={camModalHeader}>
              <span style={{ mountaineering: 'none', fontWeight: 900, fontSize: '11px' }}>🔒 D-FINANCE LIVE STREAM INTERFACE</span>
              <FiX onClick={stopCamera} style={{ cursor: 'pointer', fontSize: '20px' }} />
            </div>
            <div style={videoWrapper}>
              <video ref={videoRef} autoPlay playsInline style={videoFeedElement}></video>
            </div>
            <div style={camActionRow}>
              <button type="button" onClick={capturePhoto} style={snapButtonStyle}>
                <FiCamera size={18} /> CAPTURE EVIDENCE
              </button>
              <button type="button" onClick={stopCamera} style={abortButtonStyle}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stateless Form Sub-Components
const InputField = ({ label, type = "text", value, onChange, readOnly = false }) => (
  <div style={inputGroup}>
    <label style={labelStyle}>{label}</label>
    <input type={type} style={{...inputStyle, background: readOnly ? '#f1f5f9' : '#fff'}} value={value} readOnly={readOnly} onChange={e => onChange && onChange(e.target.value)} />
  </div>
);

const SelectField = ({ label, options, value, onChange }) => (
  <div style={inputGroup}>
    <label style={labelStyle}>{label}</label>
    <select style={inputStyle} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const CaptureBox = ({ label, field, value, onStartCamera }) => {
  return (
    <div style={upBox}>
      <label style={miniLabel}>{label}</label>
      <div style={btnRow}>
        <button type="button" onClick={() => onStartCamera(field)} style={smBtnPrimary}>
          <FiCamera /> Open Secure Camera
        </button>
      </div>
      <div style={imgContainerPreview}>
        {value ? (
          <img src={value} style={imgPrev} alt="Live Stream Captured Frame" />
        ) : (
          <div style={placeholderIcon}><FiCamera size={20} color="#cbd5e1"/></div>
        )}
      </div>
    </div>
  );
};

// --- STYLESHEET DESIGNS WITH WEB-STREAM INTERFACE OVERRIDES ---
const containerStyle = { padding: '20px', minHeight: '100vh', background: '#f8fafc', boxSizing: 'border-box' };
const headerSection = { marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' };
const mainTitle = { color: '#0f172a', margin: 0, fontWeight: '900', fontSize: '20px' };
const subTitle = { color: '#64748b', fontSize: '13px' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' };
const verifyCard = { background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' };
const cardBadge = { background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold' };
const custName = { margin: '10px 0', fontSize: '16px', fontWeight: '800' };
const loanAmt = { fontSize: '20px', fontWeight: '900', color: '#2563eb', marginBottom: '15px' };
const miniInfo = { fontSize: '10px', color: '#94a3b8', marginBottom: '15px' };
const verifyBtn = { width: '100%', padding: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '10px' };
const modalContent = { background: '#fff', borderRadius: '25px', width: '100%', maxWidth: '600px', maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const modalHeader = { background: '#0f172a', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const formScroll = { padding: '20px', overflowY: 'auto', flex: 1 };
const stepperBar = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' };
const stepDot = { width: '10px', height: '10px', borderRadius: '50%', transition: '0.3s' };
const stepLine = { width: '30px', height: '2px', margin: '0 8px' };
const sectionTitle = { fontSize: '11px', fontWeight: '900', color: '#2563eb', marginBottom: '15px', textTransform: 'uppercase', display:'flex', alignItems:'center', gap:'8px' };
const formGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '10px', fontWeight: '800', color: '#64748b' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline:'none' };
const docGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const upBox = { background: '#f8fafc', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' };
const miniLabel = { fontSize: '9px', fontWeight: '800', color: '#475569' };
const btnRow = { display: 'flex', gap: '5px' };
const smBtnPrimary = { width: '100%', padding: '10px', fontSize: '10px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', fontWeight: 'bold' };
const imgContainerPreview = { width: '100%', height: '90px', borderRadius: '10px', overflow: 'hidden', background: '#fff', border: '1px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', marginTop:'5px' };
const imgPrev = { width: '100%', height: '100%', objectFit: 'cover' };
const placeholderIcon = { opacity: 0.3 };
const footerAction = { display: 'flex', gap: '10px', marginTop: '25px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' };
const submitBtn = { flex: 2, padding: '14px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' };
const cancelBtn = { flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const statusMsg = { textAlign: 'center', marginTop: '100px', color: '#94a3b8' };

// --- 🎥 IN-APP CAMERA WINDOW OVERLAYS STYLES ---
const camModalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '15px' };
const camModalContent = { background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', overflow: 'hidden' };
const camModalHeader = { background: '#0f172a', color: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const videoWrapper = { width: '100%', height: '340px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const videoFeedElement = { width: '100%', height: '100%', objectFit: 'cover' };
const camActionRow = { padding: '15px', display: 'flex', gap: '10px', background: '#f8fafc' };
const snapButtonStyle = { flex: 2, padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const abortButtonStyle = { flex: 1, padding: '14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };

const responsiveCSS = `
  @media (max-width: 600px) {
    .resp-grid { grid-template-columns: 1fr !important; }
    .card-grid { grid-template-columns: 1fr !important; }
    .doc-resp-grid { grid-template-columns: 1fr !important; }
  }
  .animate-fade { animation: fadeIn 0.3s ease-in-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
`;

export default AdvisorVerification;