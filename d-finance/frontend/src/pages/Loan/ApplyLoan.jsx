import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { 
  FiCamera, FiAlertCircle, FiMapPin, FiCalendar, 
  FiDollarSign, FiUser, FiHome, FiCreditCard, FiHash, FiActivity, FiClock, FiCrosshair, FiX, FiFileText 
} from 'react-icons/fi';

const ApplyLoan = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // RESTRICTION STATE MATRIX
  const [loanRestriction, setLoanRestriction] = useState({ checked: false, restricted: false, currentLoanId: '' });
  
  // LEGAL MODAL COMPLIANCE STATE
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({ 
    amount: '10000', 
    type: 'Daily EMI', 
    tenure: '1', 
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    passbookPic: '',
    latitude: '',
    longitude: '',
    locationVerified: false,
    agreeTerms: false 
  });

  // CORE INTEGRATION ENGINE: Check for active loan facilities on mount
  useEffect(() => {
    const checkActiveLoanRegistry = async () => {
      if (!user.id && !user._id) return;
      try {
        const cId = user.id || user._id;
        const res = await API.get(`/loans?customerId=${cId}`);
        const loansList = Array.isArray(res.data) ? res.data : [];
        
        const activeOrPendingFile = loansList.find(l => l.status !== 'Closed' && l.status !== 'Settled');
        
        if (activeOrPendingFile) {
          setLoanRestriction({
            checked: true,
            restricted: true,
            currentLoanId: activeOrPendingFile.loanId || 'Active Contract'
          });
        } else {
          setLoanRestriction({ checked: true, restricted: false, currentLoanId: '' });
        }
      } catch (err) {
        console.error("Restriction Registry Exception Check:", err);
        setLoanRestriction({ checked: true, restricted: false, currentLoanId: '' });
      }
    };

    checkActiveLoanRegistry();
  }, [user.id, user._id]);

  const calculateFinances = () => {
    const principal = Number(formData.amount) || 0;
    const months = Number(formData.tenure) || 0;
    const processingFee = principal * 0.02;
    const netDisbursed = principal - processingFee;
    const totalInterest = principal * 0.10 * months;
    const totalPayable = principal + totalInterest;
    let totalInstallments = 0;

    if (formData.type === 'Daily EMI') {
        totalInstallments = months * 30;
    } else if (formData.type === 'Weekly EMI') {
        totalInstallments = Math.round((months * 52) / 12);
    } else {
        totalInstallments = months;
    }
    const installmentAmount = totalInstallments > 0 ? (totalPayable / totalInstallments) : 0;
    const lateFinePerEmi = installmentAmount * 0.10;

    return { 
      processingFee, netDisbursed, 
      installmentAmount: installmentAmount.toFixed(2), 
      totalInstallments, totalPayable,
      lateFinePerEmi: lateFinePerEmi.toFixed(2)
    };
  };

  const finance = calculateFinances();

  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      return alert("⚠️ Geolocation is not supported by your browser.");
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          locationVerified: true
        }));
        setLocationLoading(false);
        alert("📍 Live Location Tagged Successfully!");
      },
      (error) => {
        setLocationLoading(false);
        console.error("Location Error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("❌ Permission Denied! Please allow location access in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("❌ Location network unavailable. Try switching on device GPS.");
            break;
          case error.TIMEOUT:
            alert("❌ Location request timed out. Please try again.");
            break;
          default:
            alert("❌ Failed to fetch live location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      alert("Camera access denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg");
    setFormData(prev => ({ ...prev, passbookPic: image }));
    stopCamera();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loanRestriction.restricted) {
      return alert("❌ Operation Denied: Multiple active loan facilities are strictly forbidden.");
    }

    if (Number(formData.amount) < 10000) return alert("⚠️ Minimum loan amount must be ₹10,000.");
    if (formData.accountNumber !== formData.confirmAccountNumber) return alert("❌ Account Numbers do not match!");
    if (!formData.passbookPic) return alert("📸 Please upload your bank passbook photo.");
    if (!formData.branchName) return alert("🏦 Please enter your Branch Name.");
    if (!formData.locationVerified) return alert("📍 Mandatory: Please capture your live location coordinates.");
    
    if (!formData.agreeTerms) {
      return alert("⚠️ Action Required: Please review and accept the Legal Terms and Refund Policy to initialize deployment.");
    }
    
    setLoading(true);
    const generatedLoanId = "LN-" + Math.floor(100000 + Math.random() * 900000);

    const loanRequest = {
      ...formData,
      loanId: generatedLoanId,
      customerId: user.id || user._id,
      customerName: user.fullName,
      amount: Number(formData.amount),
      tenureMonths: Number(formData.tenure),
      emiType: formData.type,
      installmentAmount: Number(finance.installmentAmount),
      totalInstallments: finance.totalInstallments,
      processingFee: finance.processingFee,
      totalPayable: finance.totalPayable,
      netDisbursed: finance.netDisbursed,
      status: "Verification Pending",
      appliedDate: new Date().toISOString(),
      coordinates: {
        lat: formData.latitude,
        lng: formData.longitude
      }
    };

    try {
      const res = await API.post('/loans', loanRequest);
      if (res.data.success) {
        alert(`🎉 Loan Request Generated: ${generatedLoanId}`);
        navigate('/customer/tracking');
      }
    } catch (error) {
      alert(error.response?.data?.error || "Ledger sync failed!");
    } finally {
      setLoading(false);
    }
  };

  if (loanRestriction.restricted) {
    return (
      <div className="portal-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <style>{professionalStyles}</style>
        <div className="application-frame" style={{ maxWidth: '600px', padding: '40px 30px', textAlign: 'center', margin: 'auto' }}>
          <div style={{ background: '#fef2f2', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid #fee2e2' }}>
            <FiAlertCircle size={35} color="#ef4444" />
          </div>
          <h2 style={{ fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-1px', margin: '0 0 10px 0', fontSize: '22px' }}>
            Application Locked
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', lineHeight: '1.6', margin: '0 0 25px 0' }}>
            System records ke mutabik aapka ek credit ledger contract **({loanRestriction.currentLoanId})** pehle se chal raha hai. Fintech guidelines ke anusaar, jab tak aapka purana loan poora repay hokar close nahi ho jata, tab tak aap koi naya loan facility apply nahi kar sakte.
          </p>
          <button onClick={() => navigate('/customer/tracking')} className="master-submit-btn" style={{ background: '#0f172a', maxWidth: '280px', margin: '0 auto' }}>
            Track Existing Loan Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-container">
      <style>{professionalStyles}</style>

      <div className="application-frame">
        <header className="terminal-header">
          <div>
            <h1 className="main-title">Disbursement Application</h1>
            <p className="sub-title">Initialize your credit facility within Mathura Branch network</p>
          </div>
          <div className="security-tag"><FiActivity /> Encrypted Session</div>
        </header>

        <form onSubmit={handleSubmit} className="terminal-form">
          {/* Section 1: Configuration */}
          <div className="form-section">
            <h3 className="section-heading">01. Loan Configuration</h3>
            <div className="input-grid">
              <div className="field-box">
                <label className="field-label">Loan Principal (₹)</label>
                <div className="input-with-icon">
                  <FiDollarSign className="icon-main" />
                  <input type="number" className="premium-input" value={formData.amount} required 
                    min="10000" onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>
              <div className="field-box">
                <label className="field-label">Repayment Structure</label>
                <div className="input-with-icon">
                  <FiCalendar className="icon-main" />
                  <select className="premium-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Daily EMI">Daily Recovery</option>
                    <option value="Weekly EMI">Weekly Recovery</option>
                  </select>
                </div>
              </div>
              <div className="field-box">
                <label className="field-label">Facility Tenure (Months)</label>
                <div className="input-with-icon">
                  <FiClock className="icon-main" />
                  <select className="premium-input" value={formData.tenure} onChange={e => setFormData({...formData, tenure: e.target.value})}>
                    {[1,2,3,4,5,6].map(m => <option key={m} value={m}>{m} Month Term</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Bank Account Details */}
          <div className="form-section">
            <h3 className="section-heading">02. Settlement Destination</h3>
            <div className="stacked-fields">
              <div className="field-box">
                <label className="field-label">Account Holder Name</label>
                <div className="input-with-icon">
                  <FiUser className="icon-main" />
                  <input className="premium-input" placeholder="" required value={formData.accountHolderName} 
                    onChange={e => setFormData({...formData, accountHolderName: e.target.value})} />
                </div>
              </div>

              <div className="input-grid">
                <div className="field-box">
                  <label className="field-label">Bank Name</label>
                  <div className="input-with-icon">
                    <FiHome className="icon-main" />
                    <input className="premium-input" placeholder="" required value={formData.bankName} 
                      onChange={e => setFormData({...formData, bankName: e.target.value})} />
                  </div>
                </div>
                <div className="field-box">
                  <label className="field-label">Branch & Location</label>
                  <div className="input-with-icon">
                    <FiMapPin className="icon-main" />
                    <input className="premium-input" placeholder="" required value={formData.branchName} 
                      onChange={e => setFormData({...formData, branchName: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="input-grid">
                <div className="field-box">
                  <label className="field-label">Bank IFSC Code</label>
                  <div className="input-with-icon">
                    <FiHash className="icon-main" />
                    <input className="premium-input" placeholder="ABCD0123456" required value={formData.ifscCode} 
                      onChange={e => setFormData({...formData, ifscCode: e.target.value.toUpperCase()})} />
                </div>
              </div>
              <div className="field-box">
                <label className="field-label">Account Number</label>
                <div className="input-with-icon">
                  <FiCreditCard className="icon-main" />
                  <input type="password" className="premium-input" placeholder="Enter bank account number" required value={formData.accountNumber} 
                    onChange={e => setFormData({...formData, accountNumber: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="field-box">
              <label className="field-label">Re-Confirm Account Number</label>
              <input className="premium-input plain" placeholder="Verify your account number" required value={formData.confirmAccountNumber} 
                onChange={e => setFormData({...formData, confirmAccountNumber: e.target.value})} />
            </div>
          </div>
        </div>

          {/* Section 3: Live Geotagging Security */}
          <div className="form-section">
            <h3 className="section-heading">03. Operational Security (Live Geotag)</h3>
            <div className="geotag-container">
              <div className="geotag-action-box">
                <button type="button" onClick={fetchLiveLocation} disabled={locationLoading} className="location-fetch-btn">
                  <FiCrosshair className={locationLoading ? "spin-icon" : ""} />
                  {locationLoading ? "Locking GPS..." : "Capture Secure Geotag"}
                </button>
                <p className="location-hint-text">Mandatory anti-fraud check to lock application coordinates.</p>
              </div>

              {formData.locationVerified && (
                <div className="coordinates-display-grid expand-anim">
                  <div className="coord-pill"><span>LATITUDE</span><b>{formData.latitude}</b></div>
                  <div className="coord-pill"><span>LONGITUDE</span><b>{formData.longitude}</b></div>
                  <div className="geo-success-tag">✓ Hard-Locked</div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Digital Evidence */}
          <div className="form-section">
            <h3 className="section-heading">04. Digital Evidence (KYC)</h3>
            <div className="evidence-vault">
              <button type="button" onClick={startCamera} className="location-fetch-btn">
                <FiCamera /> Open Camera
              </button>

              {!formData.passbookPic && (
                <div style={{ marginTop: "15px", color: "#64748b", fontSize: "13px", fontWeight: "600" }}>
                  Add Passbook or Cancelled Cheque
                </div>
              )}

              {formData.passbookPic && (
                <div className="preview-container">
                  <img src={formData.passbookPic} className="image-preview" alt="Document Preview" />
                  <div className="success-badge">Document Uploaded</div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: LEGAL COMPLIANCE CHECKBOX */}
          <div className="form-section">
            <h3 className="section-heading">05. Regulatory Consent</h3>
            <div className="legal-checkbox-container">
              <input 
                type="checkbox" 
                id="legalAgreementCheckbox"
                className="legal-checkbox-input"
                checked={formData.agreeTerms}
                onChange={e => setFormData({ ...formData, agreeTerms: e.target.checked })}
              />
              <label htmlFor="legalAgreementCheckbox" className="legal-checkbox-label">
                I hereby declare that I have explicitly read, understood, and agreed to be bound by the official 
                <button type="button" className="legal-link-btn" onClick={() => setShowTermsModal(true)}>
                  <FiFileText /> Terms & Conditions
                </button> 
                and non-refundable 
                <button type="button" className="legal-link-btn" onClick={() => setShowTermsModal(true)}>
                  Refund Policy
                </button> of D-Finance Solutions.
              </label>
            </div>
          </div>

          {cameraActive && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#fff", padding: 20, borderRadius: 20, width: "90%", maxWidth: 500 }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12 }} />
                <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                  <button type="button" onClick={capturePhoto} className="location-fetch-btn">Capture</button>
                  <button type="button" onClick={stopCamera} className="master-submit-btn">Close</button>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="master-submit-btn">
            {loading ? "Authenticating Request..." : "Finalize Application & Submit"}
          </button>
        </form>
      </div>
      
      {/* Sticky Financial Sidebar Container */}
      <aside className="financial-terminal">
        <div className="terminal-sticky">
          <div className="emi-insight-card">
            <header>
              <span className="type-label">{formData.type.toUpperCase()}</span>
              <FiActivity color="#10b981" />
            </header>
            <div className="amount-display">
              <h2 className="curr-amount">₹{finance.installmentAmount}</h2>
              <span className="curr-cycle">/ per {formData.type === 'Daily EMI' ? 'day' : 'week'}</span>
            </div>
            <div className="late-info">
              <FiAlertCircle /> Late Penalty: ₹{finance.lateFinePerEmi}
            </div>
          </div>

          <div className="ledger-summary">
            <h4 className="ledger-title">Facility Ledger</h4>
            <div className="ledger-row highlight">
              <span>Disbursement (Net)</span>
              <span>₹{finance.netDisbursed}</span>
            </div>
            <div className="ledger-row">
              <span>Principal Amount</span>
              <span>₹{Number(formData.amount).toLocaleString()}</span>
            </div>
            <div className="ledger-row">
              <span>Interest (10% Flat)</span>
              <span>₹{(finance.totalPayable - Number(formData.amount)).toFixed(0)}</span>
            </div>
            <div className="ledger-row">
              <span>Service Fee (2%)</span>
              <span>₹{finance.processingFee}</span>
            </div>
            <div className="ledger-row total">
              <span>Total Payable</span>
              <span>₹{finance.totalPayable.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          DETAILED REGULATORY TERMS & CONDITIONS + REFUND POLICY MODAL POPUP
         ========================================================================= */}
      {showTermsModal && (
        <div className="legal-modal-overlay">
          <div className="legal-modal-frame fade-in">
            <header className="legal-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiFileText size={20} color="#6366f1" />
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                  Legal Dossier & Agreement Policies
                </h2>
              </div>
              <button type="button" className="legal-modal-close" onClick={() => setShowTermsModal(false)}>
                <FiX size={20} />
              </button>
            </header>

            <div className="legal-modal-body custom-scroll">
              <h4 className="legal-section-title">1. Execution Agreement & Principal Interest Standard</h4>
              <p className="legal-paragraph text-justify">
                By submitting this digital application, the Borrower explicitly requests the loan principal amount 
                configured within the Mathura Cluster Registry. All disbursements are governed strictly under a fixed flat 
                interest structural computation capped at 10% per calculated monthly cycle context parameters. The Borrower 
                acknowledges liability for the entire Total Payable figure generated during confirmation.
              </p>

              <h4 className="legal-section-title">2. Mandatory Collection Routines & Defaulter Metrics</h4>
              <p className="legal-paragraph text-justify">
                Repayment intervals are strictly locked to the selection chosen above (Daily Micro-Recovery or Weekly Cluster 
                Schedules). If any structural installment transaction is missed, a mandatory system compliance overhead 
                carrying a strict 10% late fine penalty coefficient multiplier will automatically attach to the following sequence lifecycle. 
                D-Finance reserves administrative rights to dispatch Field Officers or verify system-healing logs to recover outstanding balances.
              </p>

              <h4 className="legal-section-title">3. Anti-Fraud Anti-Collusion GPS Hard-Locking</h4>
              <p className="legal-paragraph text-justify">
                To prevent financial data discrepancies, identity spoofing, or clandestine operations, the capture of live 
                Geotag coordinates (Latitude & Longitude) is mandatory. This digital signature acts as a permanent verification marker 
                tying the Borrower's network location grid node directly to the active credit contract facility registry.
              </p>

              <h4 className="legal-section-title">4. Strict Non-Refundable Processing Policy</h4>
              <p className="legal-paragraph text-justify">
                <strong>SERVICE OVERHEAD FEE WAIVER CONSENT:</strong> The mandatory 2% Administrative Processing Fee deducted 
                from the Principal Sanction volume covers core ledger data compilation, bank handshake integrations, and digital 
                evidence infrastructure auditing. Once the loan application crosses the verification stage and transitions into 
                "Approved" or "Disbursed" status, this 2% fee becomes completely non-refundable, regardless of premature loan 
                cancellation or full prepayment closures executed at the terminal.
              </p>

              <h4 className="legal-section-title">5. Cancellation Before Verification Pipeline</h4>
              <p className="legal-paragraph text-justify">
                Borrowers may revoke their application structure without incurring debt liability only while the portfolio file state 
                rests in the "Verification Pending" phase. Once structural confirmation tokens are authorized by an Accountant 
                or Admin Node, the contract binds atomically, and liquidation parameters can only be neutralized via full recovery payouts.
              </p>
            </div>

            <footer className="legal-modal-footer">
              <button 
                type="button" 
                className="location-fetch-btn" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setFormData(prev => ({ ...prev, agreeTerms: true }));
                  setShowTermsModal(false);
                }}
              >
                Accept Agreement & Terms
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Updated Mobile Responsive Stylesheet ---
const professionalStyles = `
  .portal-container { display: flex; gap: 30px; padding: 30px; max-width: 1440px; margin: 0 auto; background: #f8fafc; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
  .application-frame { flex: 1; background: #fff; border-radius: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.02); border: 1px solid #eef2f6; overflow: hidden; min-width: 0; }
  .terminal-header { background: #0f172a; padding: 30px; color: #fff; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
  .main-title { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; }
  .sub-title { margin: 5px 0 0 0; color: #94a3b8; font-size: 13px; line-height: 1.4; }
  .security-tag { background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 8px 16px; border-radius: 100px; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 8px; text-transform: uppercase; white-space: nowrap; }
  .terminal-form { padding: 30px; }
  .form-section { margin-bottom: 35px; }
  .section-heading { font-size: 12px; font-weight: 900; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 25px; }
  
  .input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  .stacked-fields { display: flex; flex-direction: column; gap: 5px; }
  .field-box { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
  .field-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .input-with-icon { position: relative; display: flex; align-items: center; width: 100%; }
  .icon-main { position: absolute; left: 16px; color: #cbd5e1; font-size: 18px; pointer-events: none; }
  .premium-input { width: 100%; padding: 16px 16px 16px 52px; border-radius: 16px; border: 2px solid #f1f5f9; outline: none; background: #fff; font-weight: 800; font-size: 14px; transition: 0.3s; box-sizing: border-box; color: #0f172a; }
  .premium-input.plain { padding: 16px; }
  .premium-input:focus { border-color: #6366f1; box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.05); }
  
  .geotag-container { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
  .geotag-action-box { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
  .location-fetch-btn { background: #0f172a; color: #fff; border: none; padding: 14px 20px; border-radius: 14px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; white-space: nowrap; }
  .location-fetch-btn:hover { background: #2563eb; }
  .location-fetch-btn:disabled { background: #94a3b8; cursor: not-allowed; }
  .location-hint-text { font-size: 11px; color: #64748b; font-weight: 700; margin: 0; flex: 1; min-width: 200px; }
  .coordinates-display-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; align-items: center; background: #fff; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; }
  .coord-pill { display: flex; flex-direction: column; gap: 2px; }
  .coord-pill span { font-size: 8px; font-weight: 900; color: #94a3b8; }
  .coord-pill b { font-size: 13px; font-weight: 800; color: #0f172a; font-family: monospace; word-break: break-all; }
  .geo-success-tag { background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 900; padding: 6px 12px; border-radius: 8px; text-align: center; width: fit-content; }
  .spin-icon { animation: rotate 2s linear infinite; }
  @keyframes rotate { 100% { transform: rotate(360deg); } }

  .evidence-vault { border: 2px dashed #e2e8f0; border-radius: 24px; padding: 30px 20px; text-align: center; background: #fafafa; display: flex; flex-direction: column; align-items: center; }
  .preview-container { margin-top: 20px; }
  .image-preview { width: 100%; max-height: 250px; object-fit: contain; border-radius: 16px; }
  .success-badge { background: #10b981; color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; display: inline-block; margin-top: 12px; }
  
  .master-submit-btn { width: 100%; padding: 20px; background: #0f172a; color: #fff; border: none; border-radius: 16px; font-weight: 900; cursor: pointer; font-size: 15px; transition: 0.3s; margin-top: 10px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .master-submit-btn:hover { background: #6366f1; transform: translateY(-2px); }
  
  .financial-terminal { flex: 0 0 360px; min-width: 0; }
  .terminal-sticky { position: sticky; top: 40px; }
  .emi-insight-card { background: #0f172a; color: #fff; padding: 30px; border-radius: 30px; margin-bottom: 20px; }
  .emi-insight-card header { display: flex; justify-content: space-between; margin-bottom: 15px; }
  .type-label { font-size: 10px; font-weight: 950; letter-spacing: 2px; color: #6366f1; }
  .amount-display { margin: 10px 0; }
  .curr-amount { margin: 0; font-size: 40px; font-weight: 950; letter-spacing: -1px; display: inline-block; }
  .curr-cycle { font-size: 13px; color: #94a3b8; font-weight: 700; margin-left: 5px; }
  .late-info { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #fb7185; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; margin-top: 15px; }
  
  .ledger-summary { background: #fff; border-radius: 24px; padding: 25px; border: 1px solid #eef2f6; }
  .ledger-title { margin: 0 0 15px 0; font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
  .ledger-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; font-weight: 700; color: #64748b; gap: 10px; }
  .ledger-row.highlight { color: #10b981; }
  .ledger-row span:last-child { color: #0f172a; font-weight: 900; text-align: right; }
  .ledger-row.total { border-top: 2px solid #f1f5f9; border-bottom: none; margin-top: 10px; font-size: 15px; color: #0f172a; padding-top: 15px; }

  .expand-anim { animation: slideDown 0.3s ease; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

  .premium-input, .premium-input.plain { border: 2px solid #4b5563; background: #fff; color: #111827; }
  .premium-input:focus, .premium-input.plain:focus { border-color: #1f2937; box-shadow: 0 0 0 3px rgba(31, 41, 55, 0.15); outline: none; }

  /* LEGAL COMPLIANCE CSS BLUEPRINTS */
  .legal-checkbox-container { display: flex; gap: 12px; align-items: flex-start; background: #fff8f8; padding: 16px; border-radius: 16px; border: 1px dashed #fca5a5; }
  .legal-checkbox-input { width: 18px; height: 18px; accent-color: #0f172a; margin-top: 2px; cursor: pointer; shrink: 0; }
  .legal-checkbox-label { font-size: 12px; color: #4b5563; font-weight: 600; line-height: 1.5; cursor: pointer; }
  .legal-link-btn { background: none; border: none; padding: 0; color: #2563eb; font-weight: 800; font-size: 12px; text-decoration: underline; cursor: pointer; display: inline-flex; items: center; gap: 3px; margin: 0 4px; }
  
  .legal-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .legal-modal-frame { background: #fff; border-radius: 24px; width: 100%; max-width: 650px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #e2e8f0; }
  .legal-modal-header { padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
  .legal-modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; items: center; justify-content: center; cursor: pointer; color: #64748b; }
  .legal-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
  .legal-section-title { font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 18px 0 8px 0; letter-spacing: 0.5px; }
  .legal-section-title:first-of-type { margin-top: 0; }
  .legal-paragraph { font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 12px 0; }
  .legal-modal-footer { padding: 20px; border-top: 1px solid #f1f5f9; background: #f8fafc; border-radius: 0 0 24px 24px; }

  @media (max-width: 1200px) { .portal-container { gap: 20px; padding: 20px; } .financial-terminal { flex: 0 0 320px; } }
  @media (max-width: 992px) { .portal-container { flex-direction: column; } .financial-terminal { flex: none; width: 100%; } .terminal-sticky { position: static; } }
  @media (max-width: 576px) {
    .portal-container { padding: 10px; }
    .terminal-header { flex-direction: column; align-items: flex-start; gap: 15px; padding: 25px 20px; }
    .terminal-form { padding: 20px 15px; }
    .main-title { font-size: 20px; }
    .curr-amount { font-size: 32px; }
    .premium-input { padding: 14px 14px 14px 46px; font-size: 13px; border-radius: 12px; }
    .premium-input.plain { padding: 14px; }
    .icon-main { left: 14px; font-size: 16px; }
    .geotag-container, .evidence-vault, .ledger-summary, .emi-insight-card { padding: 15px; border-radius: 16px; }
    .coordinates-display-grid { grid-template-columns: 1fr; }
    .geo-success-tag { width: 100%; box-sizing: border-box; }
  }
`;

export default ApplyLoan;