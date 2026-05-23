import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios'; 
import { 
  FiCamera, FiAlertCircle, FiMapPin, FiCalendar, 
  FiDollarSign, FiUser, FiHome, FiCreditCard, FiHash, FiActivity, FiClock, FiCrosshair 
} from 'react-icons/fi';

const ApplyLoan = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
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
    locationVerified: false
  });

  const calculateFinances = () => {
    const principal = Number(formData.amount) || 0;
    const months = Number(formData.tenure) || 0;
    const processingFee = principal * 0.02; 
    const netDisbursed = principal - processingFee;
    const totalInterest = principal * 0.10 * months;
    const totalPayable = principal + totalInterest;
    let totalInstallments = formData.type === 'Daily EMI' ? months * 30 : months * 4;
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, passbookPic: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.amount) < 10000) return alert("⚠️ Minimum loan amount must be ₹10,000.");
    if (formData.accountNumber !== formData.confirmAccountNumber) return alert("❌ Account Numbers do not match!");
    if (!formData.passbookPic) return alert("📸 Please upload your bank passbook photo.");
    if (!formData.branchName) return alert("🏦 Please enter your Branch Name.");
    if (!formData.locationVerified) return alert("📍 Mandatory: Please capture your live location coordinates.");
    
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
                  <input className="premium-input" placeholder="Legal name as per bank records" required value={formData.accountHolderName} 
                    onChange={e => setFormData({...formData, accountHolderName: e.target.value})} />
                </div>
              </div>

              <div className="input-grid">
                <div className="field-box">
                  <label className="field-label">Full Bank Name</label>
                  <div className="input-with-icon">
                    <FiHome className="icon-main" />
                    <input className="premium-input" placeholder="e.g. HDFC Bank Ltd" required value={formData.bankName} 
                      onChange={e => setFormData({...formData, bankName: e.target.value})} />
                  </div>
                </div>
                <div className="field-box">
                  <label className="field-label">Branch & Location</label>
                  <div className="input-with-icon">
                    <FiMapPin className="icon-main" />
                    <input className="premium-input" placeholder="e.g. Krishna Nagar, Mathura" required value={formData.branchName} 
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
                  <label className="field-label">Primary Account Number</label>
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
              <label className="upload-trigger">
                <FiCamera size={24} />
                <span>Capture Bank Passbook / Cancelled Cheque</span>
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
              {formData.passbookPic && (
                <div className="preview-container">
                  <img src={formData.passbookPic} className="image-preview" alt="Document Preview" />
                  <div className="success-badge">Document Uploaded</div>
                </div>
              )}
            </div>
          </div>

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
    </div>
  );
};

// --- Updated Fully Mobile Responsive Stylesheet ---
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
  
  /* Responsive Grids */
  .input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  .stacked-fields { display: flex; flex-direction: column; gap: 5px; }
  .field-box { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
  .field-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .input-with-icon { position: relative; display: flex; align-items: center; width: 100%; }
  .icon-main { position: absolute; left: 16px; color: #cbd5e1; font-size: 18px; pointer-events: none; }
  .premium-input { width: 100%; padding: 16px 16px 16px 52px; border-radius: 16px; border: 2px solid #f1f5f9; outline: none; background: #fff; font-weight: 800; font-size: 14px; transition: 0.3s; box-sizing: border-box; color: #0f172a; }
  .premium-input.plain { padding: 16px; }
  .premium-input:focus { border-color: #6366f1; box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.05); }
  
  /* Geotag Responsive Layout */
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

  .evidence-vault { border: 2px dashed #e2e8f0; border-radius: 24px; padding: 30px 20px; text-align: center; background: #fafafa; }
  .upload-trigger { cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; color: #64748b; font-weight: 700; font-size: 13px; }
  .preview-container { margin-top: 20px; }
  .image-preview { width: 100%; max-height: 250px; object-fit: contain; border-radius: 16px; }
  .success-badge { background: #10b981; color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; display: inline-block; margin-top: 12px; }
  
  .master-submit-btn { width: 100%; padding: 20px; background: #0f172a; color: #fff; border: none; border-radius: 16px; font-weight: 900; cursor: pointer; font-size: 15px; transition: 0.3s; margin-top: 10px; box-sizing: border-box; }
  .master-submit-btn:hover { background: #6366f1; transform: translateY(-2px); }
  
  /* Sidebar Container */
  .financial-terminal { flex: 0 0 360px; min-width: 0; }
  .terminal-sticky { position: sticky; top: 40px; }
  .emi-insight-card { background: #0f172a; color: #fff; padding: 30px; border-radius: 30px; margin-bottom: 20px; }
  .emi-insight-card header { display: flex; justify-content: space-between; margin-bottom: 15px; }
  .type-label { font-size: 10px; font-weight: 950; letter-spacing: 2px; color: #6366f1; }
  .amount-display { margin: 10px 0; }
  .curr-amount { margin: 0; font-size: 40px; font-weight: 950; letter-spacing: -1px; display: inline-block; }
  .curr-cycle { font-size: 13px; color: #94a3b8; font-weight: 700; marginLeft: 5px; }
  .late-info { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #fb7185; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; margin-top: 15px; }
  
  .ledger-summary { background: #fff; border-radius: 24px; padding: 25px; border: 1px solid #eef2f6; }
  .ledger-title { margin: 0 0 15px 0; font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
  .ledger-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; font-weight: 700; color: #64748b; gap: 10px; }
  .ledger-row.highlight { color: #10b981; }
  .ledger-row span:last-child { color: #0f172a; font-weight: 900; text-align: right; }
  .ledger-row.total { border-top: 2px solid #f1f5f9; border-bottom: none; margin-top: 10px; font-size: 15px; color: #0f172a; padding-top: 15px; }

  .expand-anim { animation: slideDown 0.3s ease; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

  /* 🔥 RESPONSIVE BREAKPOINTS (MEDIA QUERIES) */
  @media (max-width: 1200px) {
    .portal-container { gap: 20px; padding: 20px; }
    .financial-terminal { flex: 0 0 320px; }
  }

  @media (max-width: 992px) {
    .portal-container { flex-direction: column; }
    .financial-terminal { flex: none; width: 100%; }
    .terminal-sticky { position: static; }
  }

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