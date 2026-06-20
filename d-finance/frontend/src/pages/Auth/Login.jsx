import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from "../../api/authApi"; 
import { FiPhone, FiArrowLeft, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';

const Login = () => {

  // 👇 mobile field same rakha hai
  const [credentials, setCredentials] = useState({ 
    mobile: '', 
    password: '', 
    newPassword: '' 
  });

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); 
  const [showHelpline, setShowHelpline] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleAction = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Forgot Password
    if (mode === 'forgot') {
      setTimeout(() => {
        alert(`Verification code sent to ${credentials.mobile}`);
        setMode('reset');
        setLoading(false);
      }, 1500);
      return;
    }

    // Reset Password
    if (mode === 'reset') {
      alert("Password updated successfully! You can now login.");
      setMode('login');
      setLoading(false);
      return;
    }

    // LOGIN
    try {

      const loginInput = credentials.mobile.trim();

      // 👇 Dynamic payload
      const payload = {
        password: credentials.password
      };

      // 👇 Email ya mobile detect karega
      if (loginInput.includes('@')) {
        payload.email = loginInput;
      } else {
        payload.mobile = loginInput;
      }

      // 👇 API call
      const response = await loginUser(payload);

      const { user, token } = response.data;

      if (token) {

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        const rolePaths = { 
          'Admin': '/admin', 
          'User': '/user', 
          'Accountant': '/accountant/approval', 
          'Customer': '/customer/dashboard' 
        };

        navigate(rolePaths[user.role] || '/');
      }

    } catch (error) {
      alert("Error: " + (error.response ? error.response.data : error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapper}>

      <style>{css}</style>

      <div style={bgOverlay}></div>

      <div style={loginCard}>

        {showHelpline && (
          <div 
            style={helplinePopup} 
            onClick={() => setShowHelpline(false)}
          >

            <div style={popupContent}>

              <FiPhone size={24} color="#c58296" />

              <h3 style={{margin: '10px 0'}}>
                Support Desk
              </h3>

              <a 
                href="tel:+918935060000" 
                style={phoneNum}
              >
                89350 60000
              </a>

              <p 
                style={{
                  fontSize: '10px',
                  color: '#999',
                  marginTop: '10px'
                }}
              >
                Click number to call
              </p>

            </div>
          </div>
        )}

        <div 
          style={{ 
            textAlign: 'center', 
            marginBottom: '30px' 
          }}
        >
          <h1 style={welcomeStyle}>
            Welcome
          </h1>

          <p style={subTitleStyle}>
            {mode === 'login' && 'Login to continue'}
            {mode === 'forgot' && 'Account Recovery'}
            {mode === 'reset' && 'Set New Password'}
          </p>
        </div>

        <form 
          onSubmit={handleAction} 
          style={{ width: '100%' }}
        >

          {mode !== 'reset' && (
            <div style={inputContainer}>

              <input
                type="text"
                placeholder=" "
                style={inputField}
                required
                value={credentials.mobile}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    mobile: e.target.value
                  })
                }
              />

              {/* 👇 Updated Label */}
              <label 
                className="floating-label" 
                style={floatingLabel}
              >
                Email / Mobile Number
              </label>

              <div style={lineStyle}></div>

            </div>
          )}

          {mode === 'login' && (
            <div style={inputContainer}>

              <input
                type={showPassword ? "text" : "password"}
                placeholder=" "
                style={inputField}
                required
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    password: e.target.value
                  })
                }
              />

              <label 
                className="floating-label" 
                style={floatingLabel}
              >
                Password
              </label>

              <div 
                style={eyeIconStyle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff size={18} />
                ) : (
                  <FiEye size={18} />
                )}
              </div>

              <div style={lineStyle}></div>

            </div>
          )}

          {mode === 'reset' && (
            <div style={inputContainer}>

              <input
                type={showPassword ? "text" : "password"}
                placeholder=" "
                style={inputField}
                required
                value={credentials.newPassword}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    newPassword: e.target.value
                  })
                }
              />

              <label 
                className="floating-label" 
                style={floatingLabel}
              >
                New Password
              </label>

              <div 
                style={eyeIconStyle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff size={18} />
                ) : (
                  <FiEye size={18} />
                )}
              </div>

              <div style={lineStyle}></div>

            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={btnStyle}
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Submit'
              : mode === 'forgot'
              ? 'Send Reset Code'
              : 'Update Password'}
          </button>

        </form>

        <div style={linksContainer}>

          {mode === 'login' ? (
            <div style={bottomLinks}>

              <span 
                onClick={() => setMode('forgot')} 
                style={footerLink}
              >
                Forgot Password?
              </span>

              <div style={divider}></div>

              <Link 
                to="/signup" 
                style={footerLink}
              >
                <FiUserPlus />
                Create Account
              </Link>

            </div>
          ) : (
            <span 
              onClick={() => setMode('login')} 
              style={footerLink}
            >
              <FiArrowLeft />
              Back to Login
            </span>
          )}

          <div 
            style={helpBtn} 
            onClick={() => setShowHelpline(true)}
          >
            <FiPhone />
            Call to Help
          </div>

        </div>

        <div 
           style={{ 
            marginTop: '20px', 
            textAlign: 'center' 
          }}
        >
          <Link
            to="/"
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              transition: '0.3s'
            }}
            onMouseOver={(e) =>
              e.target.style.color = '#0f172a'
            }
            onMouseOut={(e) =>
              e.target.style.color = '#64748b'
            }
          >
            <FiArrowLeft />
            Back to Website
          </Link>
        </div>

      </div>

      <p style={branchTag}>
        D-Finance • Prayagraj Branch
      </p>

    </div>
  );
};

// ---------------- STYLES ----------------

const pageWrapper = {
  height: '100vh',
  width: '100vw',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  backgroundImage:
    'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

const bgOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  backdropFilter: 'blur(8px)'
};

const loginCard = {
  position: 'relative',
  width: '90%',
  maxWidth: '400px',
  background: '#ffffff',
  padding: '50px 35px',
  borderRadius: '24px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 10
};

const welcomeStyle = {
  fontFamily: '"Apple Chancery", cursive',
  fontSize: '48px',
  color: '#5a6b8d',
  margin: 0
};

const subTitleStyle = {
  fontSize: '14px',
  color: '#1a3a5a',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const inputContainer = {
  position: 'relative',
  width: '100%',
  marginBottom: '30px'
};

const inputField = {
  width: '100%',
  border: 'none',
  padding: '10px 35px 10px 0',
  fontSize: '16px',
  outline: 'none',
  background: 'transparent',
  color: '#333',
  position: 'relative',
  zIndex: 2,
  boxSizing: 'border-box'
};

const eyeIconStyle = {
  position: 'absolute',
  right: '0',
  top: '10px',
  cursor: 'pointer',
  color: '#999',
  zIndex: 3
};

const floatingLabel = {
  position: 'absolute',
  left: 0,
  top: '10px',
  color: '#999',
  pointerEvents: 'none',
  transition: '0.2s ease all'
};

const lineStyle = {
  height: '1px',
  width: '100%',
  background: '#eee'
};

const btnStyle = {
  width: '100%',
  padding: '15px',
  background: '#c58296',
  color: '#fff',
  border: 'none',
  borderRadius: '30px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 8px 15px rgba(197, 130, 150, 0.3)',
  transition: '0.3s',
  textTransform: 'uppercase'
};

const linksContainer = {
  marginTop: '25px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
  width: '100%'
};

const bottomLinks = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  justifyContent: 'center'
};

const divider = {
  height: '12px',
  width: '1px',
  background: '#ddd'
};

const footerLink = {
  color: '#8e9aaf',
  fontSize: '13px',
  cursor: 'pointer',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  textDecoration: 'none'
};

const helpBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 20px',
  background: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#1a3a5a',
  cursor: 'pointer'
};

const helplinePopup = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(255,255,255,0.9)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '24px'
};

const popupContent = {
  textAlign: 'center',
  animation: 'fadeIn 0.3s ease'
};

const phoneNum = {
  fontSize: '24px',
  fontWeight: '900',
  color: '#1a3a5a',
  textDecoration: 'none',
  borderBottom: '2px solid #c58296'
};

const branchTag = {
  position: 'absolute',
  bottom: '20px',
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#5a6b8d',
  letterSpacing: '2px',
  zIndex: 10
};

const css = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  input:focus ~ .floating-label,
  input:not(:placeholder-shown) ~ .floating-label {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-10px);
  }
`;

export default Login;