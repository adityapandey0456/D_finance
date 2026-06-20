import React, { useState } from 'react';
import axios from 'axios'; // API call ke liye Axios import kiya
import { 
  FiUser, FiPhone, FiMail, FiCalendar, FiMapPin, 
  FiCreditCard, FiCheckCircle, FiArrowRight, FiLock,
  FiBriefcase, FiDollarSign, FiHome, FiUsers, FiUploadCloud
} from 'react-icons/fi';

const CustomerEntry = () => {
  const [entryMode, setEntryMode] = useState('new');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Details
    fullName: '', mobile: '', email: '', dob: '', password: '',
    religion: 'HINDU', category: 'GENERAL',
    
    // Address & KYC
    address: '', city: '', pincode: '', areaType: 'RURAL',
    idType: 'Aadhaar Card', idNumber: '',

    // Bank Details
    accountHolderName: '', bankName: '', branchName: '', 
    accountNumber: '', ifscCode: '',

    // Family, Income & Property
    earningMembers: '', familyIncomeActivities: '', monthlyIncome: '', networth: '',
    noOfMembers: '', memberOccupation: '', houseStay: '', houseType: 'CONCRETE',
    landAcres: '', residenceNature: 'Owned', drinkingWater: 'BOREWELL', 
    noOfRooms: '', cows: '',

    // Nominee Details
    nomineeName: '', nomineeMobile: '', nomineeRelation: 'BROTHER', 
    nomineeCategory: 'GENERAL', nomineeGender: 'MALE', nomineeDOB: '', nomineeAddress: '',

    // Loan & Legacy Details (Existing Customers)
    officerName: '', accountantName: '',
    totalLoanAmount: '', amountPaid: '', disbursementDate: '',
    tenureMonths: '', emiType: 'Weekly EMI', installmentAmount: '',

    // Documents (Files)
    passbookPic: null, custAadhaarFront: null, custAadhaarBack: null, 
    custLivePhoto: null, custSignature: null, custVoterFront: null, nomineePic: null
  });

  const remainingAmount = (Number(formData.totalLoanAmount) || 0) - (Number(formData.amountPaid) || 0);

  // File Upload Handler
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    setFormData({ ...formData, [fieldName]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // FormData object banaya kyunki images/files database mein bhejni hain
    const submitData = new FormData();
    
    // Form ka saara data append kar rahe hain
    Object.keys(formData).forEach(key => {
      // Khaali string ya null files ko ignore karenge
      if (formData[key] !== null && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    // Backend ko mode batane ke liye
    submitData.append('entryMode', entryMode);

    try {
      // D-Finance Backend API Call (Port 5000 par)
      // Note: Agar aapka API token mangta hai, toh Axios interceptor automatically handle kar lega
      // Agar backend ka route /api/customer/add hai, toh ise aise change karein:
      const response = await axios.post('http://localhost:5000/api/customer/add', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Images ke liye zaroori header
        }
      });

      alert(`🎉 ${entryMode === 'new' ? 'New' : 'Legacy'} Customer ${formData.fullName} successfully registered in database!`);
      console.log("Server Response:", response.data);
      
      // Submit hone ke baad form clear kar do
      setFormData({
        fullName: '', mobile: '', email: '', dob: '', password: '',
        religion: 'HINDU', category: 'GENERAL', address: '', city: '', pincode: '', areaType: 'RURAL',
        idType: 'Aadhaar Card', idNumber: '', accountHolderName: '', bankName: '', branchName: '', 
        accountNumber: '', ifscCode: '', earningMembers: '', familyIncomeActivities: '', monthlyIncome: '', networth: '',
        noOfMembers: '', memberOccupation: '', houseStay: '', houseType: 'CONCRETE', landAcres: '', residenceNature: 'Owned', drinkingWater: 'BOREWELL', 
        noOfRooms: '', cows: '', nomineeName: '', nomineeMobile: '', nomineeRelation: 'BROTHER', 
        nomineeCategory: 'GENERAL', nomineeGender: 'MALE', nomineeDOB: '', nomineeAddress: '',
        officerName: '', accountantName: '', totalLoanAmount: '', amountPaid: '', disbursementDate: '',
        tenureMonths: '', emiType: 'Weekly EMI', installmentAmount: '',
        passbookPic: null, custAadhaarFront: null, custAadhaarBack: null, custLivePhoto: null, custSignature: null, custVoterFront: null, nomineePic: null
      });

    } catch (error) {
      console.error("Database Save Error:", error);
      alert("Error saving data: " + (error.response?.data?.error || "Server connection failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCard}>
        
        {/* --- HEADER & TOGGLE --- */}
        <div style={headerStyle}>
          <div style={iconBox}><FiUser size={24} color="#fff"/></div>
          <div style={{ flex: 1 }}>
            <h2 style={titleStyle}>Customer Enrollment</h2>
            <p style={subTitleStyle}>Complete KYC & Financial Registry</p>
          </div>
        </div>

        <div style={toggleContainer}>
          <button type="button" onClick={() => setEntryMode('new')} style={entryMode === 'new' ? activeToggleBtn : inactiveToggleBtn}>
            New Customer
          </button>
          <button type="button" onClick={() => setEntryMode('legacy')} style={entryMode === 'legacy' ? activeToggleBtn : inactiveToggleBtn}>
            Existing / Legacy Customer
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* --- SECTION 1: BASIC INFO --- */}
          <div style={sectionHeader}><FiUser color="#2563eb" /> <span>Basic Information</span></div>
          <div style={grid3}>
            <div style={inputGroup}><label style={labelStyle}>Full Name *</label><input type="text" required style={inputStyleNoIcon} value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>Mobile *</label><input type="number" required style={inputStyleNoIcon} value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>Password (For App) *</label><input type="text" required style={inputStyleNoIcon} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} /></div>
            <div style={inputGroup}>
              <label style={labelStyle}>Religion</label>
              <select style={inputStyleNoIcon} value={formData.religion} onChange={(e) => setFormData({...formData, religion: e.target.value})}>
                <option>HINDU</option><option>MUSLIM</option><option>SIKH</option><option>CHRISTIAN</option><option>OTHER</option>
              </select>
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Category</label>
              <select style={inputStyleNoIcon} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option>GENERAL</option><option>OBC</option><option>SC/ST</option>
              </select>
            </div>
          </div>

          {/* --- SECTION 2: ADDRESS & BANK --- */}
          <div style={{...sectionHeader, marginTop: '30px'}}><FiMapPin color="#2563eb" /> <span>Address & Bank Details</span></div>
          <div style={grid3}>
            <div style={inputGroup}><label style={labelStyle}>Full Address</label><input type="text" style={inputStyleNoIcon} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>Area Type</label>
              <select style={inputStyleNoIcon} value={formData.areaType} onChange={(e) => setFormData({...formData, areaType: e.target.value})}><option>RURAL</option><option>URBAN</option></select>
            </div>
            <div style={inputGroup}><label style={labelStyle}>Bank Name</label><input type="text" style={inputStyleNoIcon} value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>Account Number</label><input type="text" style={inputStyleNoIcon} value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>IFSC Code</label><input type="text" style={inputStyleNoIcon} value={formData.ifscCode} onChange={(e) => setFormData({...formData, ifscCode: e.target.value})} /></div>
          </div>

          {/* --- SECTION 3: FAMILY & PROPERTY --- */}
          <div style={{...sectionHeader, marginTop: '30px'}}><FiHome color="#2563eb" /> <span>Family & Assets Profile</span></div>
          <div style={grid3}>
            <div style={inputGroup}><label style={labelStyle}>Monthly Income (₹)</label><input type="number" style={inputStyleNoIcon} value={formData.monthlyIncome} onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>Income Activity</label><input type="text" placeholder="e.g. Farming, Business" style={inputStyleNoIcon} value={formData.familyIncomeActivities} onChange={(e) => setFormData({...formData, familyIncomeActivities: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>Total Members</label><input type="number" style={inputStyleNoIcon} value={formData.noOfMembers} onChange={(e) => setFormData({...formData, noOfMembers: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>House Type</label>
              <select style={inputStyleNoIcon} value={formData.houseType} onChange={(e) => setFormData({...formData, houseType: e.target.value})}><option>CONCRETE</option><option>SEMI-CONCRETE</option><option>MUD</option></select>
            </div>
            <div style={inputGroup}><label style={labelStyle}>Residence Nature</label>
              <select style={inputStyleNoIcon} value={formData.residenceNature} onChange={(e) => setFormData({...formData, residenceNature: e.target.value})}><option>Owned</option><option>Rented</option></select>
            </div>
            <div style={inputGroup}><label style={labelStyle}>Land (Acres) / Cows</label><input type="text" placeholder="1 Acre / 2 Cows" style={inputStyleNoIcon} value={formData.landAcres} onChange={(e) => setFormData({...formData, landAcres: e.target.value})} /></div>
          </div>

          {/* --- SECTION 4: NOMINEE DETAILS --- */}
          <div style={{...sectionHeader, marginTop: '30px'}}><FiUsers color="#2563eb" /> <span>Nominee Details</span></div>
          <div style={grid3}>
            <div style={inputGroup}><label style={labelStyle}>Nominee Name</label><input type="text" style={inputStyleNoIcon} value={formData.nomineeName} onChange={(e) => setFormData({...formData, nomineeName: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>Relation</label><input type="text" style={inputStyleNoIcon} value={formData.nomineeRelation} onChange={(e) => setFormData({...formData, nomineeRelation: e.target.value})} /></div>
            <div style={inputGroup}><label style={labelStyle}>Nominee Mobile</label><input type="number" style={inputStyleNoIcon} value={formData.nomineeMobile} onChange={(e) => setFormData({...formData, nomineeMobile: e.target.value})} /></div>
          </div>

          {/* --- SECTION 5: DOCUMENTS UPLOAD --- */}
          <div style={{...sectionHeader, marginTop: '30px'}}><FiUploadCloud color="#2563eb" /> <span>Document Uploads (Images)</span></div>
          <div style={grid3}>
            <div style={inputGroup}><label style={labelStyle}>Customer Live Photo</label><input type="file" accept="image/*" style={fileInputStyle} onChange={(e) => handleFileChange(e, 'custLivePhoto')} /></div>
            <div style={inputGroup}><label style={labelStyle}>Aadhaar Front</label><input type="file" accept="image/*" style={fileInputStyle} onChange={(e) => handleFileChange(e, 'custAadhaarFront')} /></div>
            <div style={inputGroup}><label style={labelStyle}>Aadhaar Back</label><input type="file" accept="image/*" style={fileInputStyle} onChange={(e) => handleFileChange(e, 'custAadhaarBack')} /></div>
            <div style={inputGroup}><label style={labelStyle}>Voter ID Front</label><input type="file" accept="image/*" style={fileInputStyle} onChange={(e) => handleFileChange(e, 'custVoterFront')} /></div>
            <div style={inputGroup}><label style={labelStyle}>Bank Passbook</label><input type="file" accept="image/*" style={fileInputStyle} onChange={(e) => handleFileChange(e, 'passbookPic')} /></div>
            <div style={inputGroup}><label style={labelStyle}>Nominee Photo</label><input type="file" accept="image/*" style={fileInputStyle} onChange={(e) => handleFileChange(e, 'nomineePic')} /></div>
            <div style={inputGroup}><label style={labelStyle}>Customer Signature</label><input type="file" accept="image/*" style={fileInputStyle} onChange={(e) => handleFileChange(e, 'custSignature')} /></div>
          </div>

          {/* --- SECTION 6: LEGACY LOAN DETAILS (Only for Existing) --- */}
          {entryMode === 'legacy' && (
            <div style={legacyBox}>
              <div style={{...sectionHeader, color: '#b91c1c'}}><FiBriefcase color="#b91c1c" /> <span>Legacy Loan & Migration Data</span></div>
              <div style={grid3}>
                <div style={inputGroup}><label style={labelStyle}>Total Loan Disbursed (₹)</label><input type="number" style={inputStyleNoIcon} value={formData.totalLoanAmount} onChange={(e) => setFormData({...formData, totalLoanAmount: e.target.value})} /></div>
                <div style={inputGroup}><label style={labelStyle}>Amount Paid (₹)</label><input type="number" style={inputStyleNoIcon} value={formData.amountPaid} onChange={(e) => setFormData({...formData, amountPaid: e.target.value})} /></div>
                <div style={inputGroup}><label style={labelStyle}>Remaining Pending</label><input type="number" readOnly style={{...inputStyleNoIcon, background: '#e2e8f0'}} value={remainingAmount > 0 ? remainingAmount : 0} /></div>
                
                <div style={inputGroup}><label style={labelStyle}>EMI Type</label>
                  <select style={inputStyleNoIcon} value={formData.emiType} onChange={(e) => setFormData({...formData, emiType: e.target.value})}><option>Weekly EMI</option><option>Daily EMI</option><option>Monthly EMI</option></select>
                </div>
                <div style={inputGroup}><label style={labelStyle}>Installment Amount (₹)</label><input type="number" style={inputStyleNoIcon} value={formData.installmentAmount} onChange={(e) => setFormData({...formData, installmentAmount: e.target.value})} /></div>
                <div style={inputGroup}><label style={labelStyle}>Tenure (Months)</label><input type="number" style={inputStyleNoIcon} value={formData.tenureMonths} onChange={(e) => setFormData({...formData, tenureMonths: e.target.value})} /></div>
                
                <div style={inputGroup}><label style={labelStyle}>Disbursement Date</label><input type="date" style={inputStyleNoIcon} value={formData.disbursementDate} onChange={(e) => setFormData({...formData, disbursementDate: e.target.value})} /></div>
                <div style={inputGroup}><label style={labelStyle}>Verified By (Officer Name)</label><input type="text" style={inputStyleNoIcon} value={formData.officerName} onChange={(e) => setFormData({...formData, officerName: e.target.value})} /></div>
              </div>
            </div>
          )}

          {/* --- SUBMIT BUTTON --- */}
          <button type="submit" disabled={isSubmitting} style={isSubmitting ? {...btnStyle, opacity: 0.7} : btnStyle}>
            {isSubmitting ? 'Uploading Data & Images...' : (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                <FiCheckCircle /> {entryMode === 'new' ? 'Register New Customer' : 'Migrate Legacy Profile'} <FiArrowRight />
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { padding: '40px 20px', background: '#f8fafc', minHeight: '100vh', fontFamily: '"Inter", sans-serif' };
const formCard = { maxWidth: '1000px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' };
const iconBox = { width: '50px', height: '50px', background: '#2563eb', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' };
const titleStyle = { margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a' };
const subTitleStyle = { margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' };

const toggleContainer = { display: 'flex', gap: '10px', background: '#f1f5f9', padding: '6px', borderRadius: '12px', marginBottom: '30px' };
const baseToggleBtn = { flex: 1, padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: '0.3s', border: 'none' };
const activeToggleBtn = { ...baseToggleBtn, background: '#fff', color: '#0f172a', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
const inactiveToggleBtn = { ...baseToggleBtn, background: 'transparent', color: '#64748b' };

const sectionHeader = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#2563eb', letterSpacing: '1px', marginBottom: '20px' };
const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' };

const inputGroup = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#475569', marginLeft: '2px' };
const inputStyleNoIcon = { width: '100%', padding: '14px 15px', borderRadius: '14px', border: '1.5px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '14px', fontWeight: '600', transition: '0.3s focus', boxSizing: 'border-box' };
const fileInputStyle = { ...inputStyleNoIcon, padding: '10px', background: '#fff', fontSize: '12px', cursor: 'pointer' };

const legacyBox = { marginTop: '35px', padding: '25px', background: '#fef2f2', borderRadius: '20px', border: '1px dashed #f87171' };
const btnStyle = { marginTop: '40px', width: '100%', padding: '18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: '0.3s' };

export default CustomerEntry;