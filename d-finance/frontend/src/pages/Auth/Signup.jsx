import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupUser } from "../../api/authApi";
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    role: 'Customer',
    referredBy: ''
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 🔥 MOBILE NUMBER INPUT MASKING: Sirf numbers allow karein
    if (name === "mobile") {
        const onlyNums = value.replace(/[^0-9]/g, '');
        if (onlyNums.length <= 10) {
            setFormData({ ...formData, [name]: onlyNums });
        }
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // 🔥 VALIDATION LOGIC
    if (formData.mobile.length !== 10) {
        alert("⚠️ Please enter a valid 10-digit mobile number.");
        return;
    }

    setLoading(true);

    try {
      const finalData = {
        ...formData,
        email: formData.email.toLowerCase().trim()
      };

      const res = await signupUser(finalData);
      
      // Backend status code check
      if (res.status === 201 || res.data.success) {
        alert("✅ Registration Successful! Please login.");
        navigate('/login');
      }
    } catch (err) {
      // 🔥 DUPLICATE MOBILE CHECK: Backend error handle karega
      const msg = err.response?.data?.error || "Registration Failed. Mobile might already be registered.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <style>{css}</style>
      <div style={bgOverlay}></div>

      <div style={loginCard}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={welcomeStyle}>Join Us</h1>
          <p style={subTitleStyle}>Create your cloud account</p>
        </div>

        <form onSubmit={handleSignup} style={{ width: '100%' }}>
          {/* Full Name */}
          <div style={inputContainer}>
            <input type="text" name="fullName" placeholder=" " style={inputField} required 
              value={formData.fullName} onChange={handleInputChange} />
            <label className="floating-label" style={floatingLabel}>Full Name</label>
            <div style={lineStyle}></div>
          </div>

          {/* Role (Fixed) */}
          {/* <div style={inputContainer}>
            <div style={{...inputField, padding: '10px 0', fontWeight: '700', color: '#5a6b8d'}}>Customer (Borrower)</div>
            <label style={fixedLabel}>Joining As</label>
            <div style={lineStyle}></div>
          </div> */}

          {/* Mobile Number */}
          <div style={inputContainer}>
            <input type="tel" name="mobile" placeholder=" " style={inputField} required 
              value={formData.mobile} onChange={handleInputChange} />
            <label className="floating-label" style={floatingLabel}>Mobile Number (10 Digits)</label>
            <div style={lineStyle}></div>
          </div>

          {/* Email */}
          <div style={inputContainer}>
            <input type="email" name="email" placeholder=" " style={inputField} required 
              value={formData.email} onChange={handleInputChange} />
            <label className="floating-label" style={floatingLabel}>Email Address</label>
            <div style={lineStyle}></div>
          </div>

          {/* Password */}
          <div style={inputContainer}>
            <input type={showPassword ? "text" : "password"} name="password" placeholder=" " style={inputField} required 
              value={formData.password} onChange={handleInputChange} />
            <label className="floating-label" style={floatingLabel}>Create Password</label>
            <div style={eyeIconStyle} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </div>
            <div style={lineStyle}></div>
          </div>

          {/* Referral Code */}
          <div style={inputContainer}>
            <input type="text" name="referredBy" placeholder=" " style={inputField} 
              value={formData.referredBy} onChange={handleInputChange} />
            <label className="floating-label" style={floatingLabel}>Advisor Code (Optional)</label>
            <div style={lineStyle}></div>
          </div>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        <div style={linksContainer}>
          <Link to="/login" style={footerLink}>
            <FiArrowLeft /> Already have an account? Sign In
          </Link>
        </div>
      </div>
      <p style={branchTag}>D-Finance • Mathura Branch</p>
    </div>
  );
};

// ... (Styles remains same)
const pageWrapper = { height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflowY: 'auto', padding: '20px 0', backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', };
const bgOverlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(8px)', zIndex: 0 };
const loginCard = { position: 'relative', width: '90%', maxWidth: '450px', background: '#ffffff', padding: '40px 35px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, maxHeight: '90vh', overflowY: 'auto' };
const welcomeStyle = { fontFamily: '"Apple Chancery", cursive', fontSize: '40px', color: '#5a6b8d', margin: 0 };
const subTitleStyle = { fontSize: '12px', color: '#1a3a5a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' };
const inputContainer = { position: 'relative', width: '100%', marginBottom: '25px' };
const inputField = { width: '100%', border: 'none', padding: '10px 35px 10px 0', fontSize: '15px', outline: 'none', background: 'transparent', color: '#333', position: 'relative', zIndex: 2, boxSizing: 'border-box' };
const floatingLabel = { position: 'absolute', left: 0, top: '10px', color: '#999', pointerEvents: 'none', transition: '0.3s ease all' };
const fixedLabel = { position: 'absolute', left: 0, top: '-15px', color: '#c58296', fontSize: '11px', fontWeight: '800' };
const lineStyle = { height: '1px', width: '100%', background: '#eee' };
const eyeIconStyle = { position: 'absolute', right: '0', top: '10px', cursor: 'pointer', color: '#999', zIndex: 3 };
const btnStyle = { width: '100%', padding: '15px', background: '#c58296', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 15px rgba(197, 130, 150, 0.3)', transition: '0.3s', textTransform: 'uppercase', marginTop: '10px' };
const linksContainer = { marginTop: '20px' };
const footerLink = { color: '#8e9aaf', fontSize: '13px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' };
const branchTag = { position: 'fixed', bottom: '15px', fontSize: '10px', fontWeight: 'bold', color: '#5a6b8d', letterSpacing: '2px', zIndex: 10 };

const css = `
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  input:focus ~ .floating-label, input:not(:placeholder-shown) ~ .floating-label { opacity: 0; pointer-events: none; transform: translateY(-10px); }
  div::-webkit-scrollbar { width: 5px; }
  div::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
`;

export default Signup;