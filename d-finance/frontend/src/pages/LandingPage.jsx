import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { 
  FiArrowRight, FiShield, FiZap, FiChevronRight, FiCheck, 
  FiCpu, FiActivity, FiLayers, FiMenu, FiX, FiLock, FiStar, FiPhone, FiMail, FiMapPin, FiInfo, FiMessageSquare 
} from 'react-icons/fi';

const LandingPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const fetchBlogs = async () => {
      try {
        const res = await API.get('/blogs'); 
        if(res.data) setBlogs(res.data.reverse().slice(0, 3));
      } catch (err) { console.log("Static Mode Active"); }
    };
    fetchBlogs();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={masterContainer}>
      <style>{animations}</style>
      
      {/* --- 💎 PREMIUM GLASS NAVBAR --- */}
      <nav style={scrolled ? navScrolled : navStyle}>
        <div style={navInner}>
          <motion.div whileHover={{ scale: 1.02 }} style={logoWrapper}>
            <div style={logoIcon}><FiLayers size={20} color="white" /></div>
            <div style={{...logoText, color: scrolled ? '#0f172a' : '#fff'}}>
              D-FINANCE <span style={tm}>PRO</span>
            </div>
          </motion.div>
          
          <div className="desktop-menu" style={navLinks}>
            <a href="#architecture" style={{...linkStyle, color: scrolled ? '#64748b' : '#cbd5e1'}}>Architecture</a>
            <a href="#about" style={{...linkStyle, color: scrolled ? '#64748b' : '#cbd5e1'}}>About Us</a>
            <a href="#intelligence" style={{...linkStyle, color: scrolled ? '#64748b' : '#cbd5e1'}}>Intelligence</a>
            <a href="#contact" style={{...linkStyle, color: scrolled ? '#64748b' : '#cbd5e1'}}>Contact Us</a>
            <div style={vDivider}></div>
            <Link to="/login" style={{...loginBtn, color: scrolled ? '#0f172a' : '#fff'}}>Sign In</Link>
            <Link to="/signup" style={scrolled ? signupBtnScrolled : signupBtn}>Get Started</Link>
          </div>

          <div className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={mobileToggleStyle}>
             {isMobileMenuOpen ? <FiX size={24} color="#fff" /> : <FiMenu size={24} color={scrolled ? '#000' : '#fff'} />}
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={mobileDropdownStyle}>
              <a href="#architecture" onClick={() => setIsMobileMenuOpen(false)} style={mobLink}>Architecture</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} style={mobLink}>About Us</a>
              <a href="#intelligence" onClick={() => setIsMobileMenuOpen(false)} style={mobLink}>Intelligence</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} style={mobLink}>Contact Us</a>
              <Link to="/login" style={mobLink}>Sign In</Link>
              <Link to="/signup" style={mobBtn}>Get Started</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- 🚀 HERO SECTION --- */}
      <section style={heroWrapper}>
        <div className="animated-mesh"></div>
        <div className="glow-orborb-one"></div>
        <div className="glow-orborb-two"></div>
        
        <div style={heroContent}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={promoBadge}>
              <span className="pulse-dot"></span> 
              <FiLock size={12} style={{marginRight: '8px'}}/> SECURE FINANCIAL LEDGER ACTIVE
            </div>
            <h1 style={heroTitle}>
              Powering the <span style={gradientText}>Next Gen</span> <br/> 
              of Digital Lending.
            </h1>
            <p style={heroSubText}>
              The institutional infrastructure for digital credit. Automate recoveries, 
              verify identities, and scale capital with 256-bit security.
            </p>
            <div className="hero-btns" style={btnGroup}>
              <Link to="/signup" style={btnPrimary}>Start Free Trial <FiArrowRight /></Link>
              <Link to="/login" style={btnSecondary}>View Live Demo</Link>
            </div>
          </motion.div>
        </div>

        <motion.div className="hero-image-container" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <div className="browser-mockup">
            <div className="browser-header">
              <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
              <div className="address-bar">d-finance.pro/analytics</div>
            </div>
            <div className="browser-body">
              <img src="https://images.pexels.com/photos/6770610/pexels-photo-6770610.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Dashboard" style={previewImg} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- 📊 STATS --- */}
      <div style={statsWrapper} className="stats-grid">
        <StatBox val="₹500Cr+" lab="Assets Managed" />
        <StatBox val="99.9%" lab="Recovery Rate" />
        <StatBox val="2ms" lab="API Latency" />
        <StatBox val="10k+" lab="Active Lenders" />
      </div>

      {/* --- 📊 CAPABILITIES --- */}
      <section id="architecture" style={sectionContainer('#fff')}>
        <div style={centeredHeader}>
          <div style={sectionBadge}>PLATFORM ARCHITECTURE</div>
          <h2 style={sectionTitle}>Enterprise-Grade Financial Infrastructure</h2>
          <p style={{...cardP, maxWidth: '600px', margin: '20px auto'}}>
            We provide a unified ecosystem that secures every transaction node, ensuring operational transparency from disbursement to final settlement.
          </p>
        </div>

        <div className="feature-grid" style={gridContainer}>
          <FeatureCard icon={<FiShield />} title="Identity & Audit" desc="Aadhaar-linked biometric and KYC verification combined with real-time field audit trails." benefit="Fraud-Proof Onboarding" color="#2563eb" />
          <FeatureCard icon={<FiActivity />} title="Efficiency Engine" desc="Automated Weekly Collection Efficiency (WCE) logic that flags defaults before they escalate." benefit="Predictive Recovery" color="#10b981" />
          <FeatureCard icon={<FiCpu />} title="Ledger Automation" desc="Real-time amortization schedules and instant balance updates across all user nodes." benefit="100% Transparency" color="#6366f1" />
        </div>
      </section>

      {/* --- 🕵️ ABOUT US SECTION --- */}
      <section id="about" style={sectionContainer('#f8fafc')}>
        <div style={centeredHeader}>
          <div style={sectionBadge}>ABOUT D-FINANCE</div>
          <h2 style={sectionTitle}>Securing Financial Inclusion & Integrity</h2>
          <p style={{...cardP, maxWidth: '700px', margin: '20px auto'}}>
            D-Finance Solutions is an advanced institutional fin-tech pipeline engineered to streamline digital credit, underwriting analytics, and risk compliance management frameworks across the region.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={aboutGlassCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <FiInfo color="#6366f1" size={24} />
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '950' }}>Our Core Mission</h3>
            </div>
            <p style={{ ...cardP, fontSize: '15px', lineHeight: '1.7' }}>
              Our operational blueprint aims to empower distributed micro-finance nodes with real-time ledger synchronization, state-of-the-art secure geotagging algorithms, and robust decentralized monitoring tools. By optimizing local credit verification routines, we reduce structural asset liability risk to zero disclosure parameters.
            </p>
          </div>

          <div style={aboutGlassCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <FiShield color="#10b981" size={24} />
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '950' }}>The Prayagraj Hub Node</h3>
            </div>
            <p style={{ ...cardP, fontSize: '15px', lineHeight: '1.7' }}>
              Operating dynamically under state banking regulations, our main technical core hub at Prayagraj, Uttar Pradesh, orchestrates all distributed cluster communications. We ensure automated execution of system-healing databases and transaction-level encryption tracking protocols for transparent borrower portfolio audits.
            </p>
          </div>
        </div>
      </section>

      {/* --- 👑 FOUNDING LEADERSHIP --- */}
      <section style={testimonialSectionStyle}>
        <div style={centeredHeader}>
          <div style={sectionBadge}>FOUNDERS</div>
          <h2 style={sectionTitle}>Visionary Leadership</h2>
          <p style={{...cardP, maxWidth: '600px', margin: '20px auto'}}>
            The minds driving D-Finance towards financial inclusion and operational excellence.
          </p>
        </div>
        
        <div className="feature-grid" style={gridContainer}>
          <div style={glassFeature}>
             <img src="/dhiraj-sharma.jpg" alt="Dhiraj Sharma" style={avatarStyle} />
             <h4 style={cardH3}>Dhiraj Sharma</h4>
             <p style={{fontSize: '12px', fontWeight: '900', color: '#6366f1', marginBottom: '10px'}}>CO-FOUNDER & DIRECTOR</p>
             <a href="tel:+918935060000" style={contactLink}><FiPhone size={12}/> +91 89350 60000</a>
             <p style={cardP}>Architecting the future of secure, real-time micro-finance ledgers.</p>
          </div>

          <div style={glassFeature}>
             <img src="/pawan-sharma.jpg" alt="Pawan Sharma" style={avatarStyle} />
             <h4 style={cardH3}>Pawan Sharma</h4>
             <p style={{fontSize: '12px', fontWeight: '900', color: '#10b981', marginBottom: '10px'}}>Team Manager</p>
             <a href="tel:+919151363738" style={contactLink}><FiPhone size={12}/> +91 91513 63738</a>
             <p style={cardP}>Standardizing operations through automated WCE logic and field audit protocols.</p>
          </div>

          <div style={glassFeature}>
             <img src="/pradeep-sharma.jpg" alt="Pradeep Sharma" style={avatarStyle} />
             <h4 style={cardH3}>Pradeep Sharma</h4>
             <p style={{fontSize: '12px', fontWeight: '900', color: '#6366f1', marginBottom: '10px'}}>Operational & Financial Manager</p>
             <a href="tel:+917409234299" style={contactLink}><FiPhone size={12}/> +91 74092 34299</a>
             <p style={cardP}>Standardizing operations through automated WCE logic and field audit protocols.</p>
          </div>
        </div>
      </section>

      {/* --- 🤝 GOVERNANCE --- */}
      <section style={testimonialSectionStyle}>
        <div style={centeredHeader}>
          <div style={sectionBadge}>GOVERNANCE</div>
          <h2 style={sectionTitle}>Leadership & Compliance</h2>
          <p style={{...cardP, maxWidth: '600px', margin: '20px auto'}}>
            Backed by industry veterans and governed by strict legal adherence.
          </p>
        </div>
        
        <div className="feature-grid" style={gridContainer}>
          <div style={glassFeature}>
            <img src="/sonu.png" alt="Legal" style={avatarStyle} />
             <h4 style={cardH3}>Mr. Sonu </h4>
             <p style={{fontSize: '12px', fontWeight: '900', color: '#3b82f6', marginBottom: '10px'}}>LEAD INVESTOR</p>
             <a href="tel:+918057285030" style={contactLink}><FiPhone size={12}/> +91 80572 85030</a>
             <p style={cardP}>Strategic growth partner focusing on digital credit infrastructure.</p>
          </div>

          <div style={glassFeature}>
             <img src="/legal.png" alt="Legal" style={avatarStyle} />
             <h4 style={cardH3}>Advocate Mehraj khan</h4>
             <p style={{fontSize: '12px', fontWeight: '900', color: '#10b981', marginBottom: '10px'}}>LEGAL & COMPLIANCE HEAD</p>
             <a href="tel:+919286965562" style={contactLink}><FiPhone size={12}/> +91 92869 65562</a>
             <p style={cardP}>Ensuring 100% adherence to D Finance SOPs and financial regulations.</p>
          </div>
        </div>
      </section>

      {/* --- 🧠 INTELLIGENCE --- */}
      <section id="intelligence" style={sectionContainer('#f8fafc')}>
        <div style={blogHeaderTop}>
           <div style={{textAlign: 'left'}}>
            <div style={sectionBadge}>INTELLIGENCE</div>
            <h2 style={sectionTitle}>Market Insights</h2>
          </div>
          <Link to="/blogs" className="view-all">View All <FiChevronRight /></Link>
        </div>

        <div className="blog-grid-resp" style={blogGrid}>
          {blogs.length > 0 ? blogs.map(blog => (
            <BlogCard key={blog._id} blog={blog} />
          )) : (
            <div style={noData}>⚡ Insights coming soon to your node...</div>
          )}
        </div>
      </section>

      {/* --- 📞 CONTACT US HUB --- */}
      <section id="contact" style={sectionContainer('#fff')}>
        <div style={centeredHeader}>
          <div style={sectionBadge}>CONTACT TERMINAL</div>
          <h2 style={sectionTitle}>Get In Touch With Our Registry</h2>
          <p style={{...cardP, maxWidth: '600px', margin: '20px auto'}}>
            Have queries regarding automated amortization parameters or portfolio verification? Reach out instantly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={contactInfoRow}>
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#3b82f6', display: 'flex' }}><FiPhone size={20} /></div>
              <div>
                <small style={contactMiniLabel}>Central Telephone</small>
                <a href="tel:+918935060000" style={contactAnchorLink}>+91 89350 60000</a>
              </div>
            </div>

            <div style={contactInfoRow}>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '12px', color: '#10b981', display: 'flex' }}><FiMail size={20} /></div>
              <div>
                <small style={contactMiniLabel}>Secure Mail Access</small>
                <a href="mailto:dfinance00000@gmail.com" style={contactAnchorLink}>dfinance00000@gmail.com</a>
              </div>
            </div>

            <div style={contactInfoRow}>
              <div style={{ background: '#f5f3ff', padding: '12px', borderRadius: '12px', color: '#6366f1', display: 'flex' }}><FiMapPin size={20} /></div>
              <div>
                <small style={contactMiniLabel}>Physical Hub Node Location</small>
                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>Prayagraj Branch, Uttar Pradesh, India</span>
              </div>
            </div>
          </div>

          <div style={contactFormBox}>
            <form onSubmit={(e) => { e.preventDefault(); alert("🎉 Message transmitted securely to server nodes!"); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input type="text" placeholder="Your Full Name" required style={contactInlineInput} />
                <input type="tel" placeholder="Mobile (10 Digits)" required style={contactInlineInput} />
              </div>
              <input type="email" placeholder="Your Email Address" required style={contactInlineInput} />
              <textarea placeholder="State your application query or feedback message parameters..." required rows="4" style={{ ...contactInlineInput, resize: 'none', fontFamily: 'sans-serif' }}></textarea>
              <button type="submit" style={contactSubmitBtn}>Transmit Message Parameters</button>
            </form>
          </div>
        </div>
      </section>

      {/* --- 📞 FINAL CTA --- */}
      <section style={ctaSection}>
        <div style={ctaCard}>
            <h2 style={ctaTitle}>Ready to scale your <br/> lending infrastructure?</h2>
            <p style={ctaText}>Join 1,000+ lenders modernizing their digital credit operations.</p>
            <Link to="/signup" style={btnPrimaryLarge}>Start Free Trial Now</Link>
        </div>
      </section>

      {/* =========================================================================
          🔥 REARRANGED HIGH-PREMIUM PRODUCTION FOOTER TERMINAL
         ========================================================================= */}
      <footer style={footerStyle}>
        <div style={footerMain}>
          {/* COLUMN 1: BRAND ARCHITECTURE */}
          <div style={fBrandStyle}>
            <h2 style={fLogo}>D-FINANCE <span style={{ fontSize: '10px', color: '#10b981', verticalAlign: 'middle', border: '1px solid #10b981', padding: '2px 6px', borderRadius: '6px', marginLeft: '6px' }}>v3.0</span></h2>
            <p style={fText}>
              Empowering global decentralized credit institutions with robust automated ledgers. Governed by 
              Federal SOP standards, we offer hard-locked infrastructure layers with end-to-end telemetry risk audits.
            </p>
            <div style={footerSecurityBadge}>
              <FiShield size={14} color="#10b981" /> <span>AES-256 BIT ENC GRID CONNECTION ACTIVE</span>
            </div>
          </div>

          {/* COLUMN 2: INDEX ROUTINGS */}
          <div style={fColumnStyle}>
            <h4 style={fHeadingStyle}>Platform Node</h4>
            <a href="#architecture" style={fLinkStyle}>Architecture</a>
            <a href="#about" style={fLinkStyle}>About Cluster</a>
            <a href="#intelligence" style={fLinkStyle}>Intelligence Reports</a>
            <a href="#contact" style={fLinkStyle}>Help Request Desk</a>
          </div>

          {/* COLUMN 3: COMPLIANCE BOUNDS */}
          <div style={fColumnStyle}>
            <h4 style={fHeadingStyle}>Governance</h4>
            <span style={fLinkStyleStatic}>SOP Rules Alignment</span>
            <span style={fLinkStyleStatic}>ISO-27001 Certified</span>
            <span style={fLinkStyleStatic}>Privacy Registries</span>
            <span style={fLinkStyleStatic}>Terms of Leverage</span>
          </div>

          {/* COLUMN 4: DIRECT CONNECT GATEWAY */}
          <div style={fColumnStyle}>
            <h4 style={fHeadingStyle}>Prayagraj Hub</h4>
            <a href="tel:+918935060000" style={fLinkStyleActive}><FiPhone size={12}/> +91 89350 60000</a>
            <a href="mailto:dfinance00000@gmail.com" style={fLinkStyleActive}><FiMail size={12}/> dfinance@space.pro</a>
            <span style={fLinkStyleStatic}><FiMapPin size={12}/> Civil Lines, Prayagraj, UP</span>
          </div>
        </div>

        {/* FOOTER METRICS RUNTIME STATUS BOTTOM LINE */}
        <div style={fBottom}>
          <p style={{ margin: 0 }}>© 2026 D-Finance Enterprise Node. All rights reserved across institutional networks.</p>
          <div style={footerTickerWrapper}>
            <span className="ticker-dot"></span> <span style={{ letterSpacing: '1px' }}>SYSTEM STATUS: 100% OPERATIONAL [LATENCY 24ms]</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const StatBox = ({ val, lab }) => (
  <div style={statBoxStyle}>
    <span style={statValStyle}>{val}</span>
    <span style={statLabStyle}>{lab}</span>
  </div>
);

const FeatureCard = ({icon, title, desc, benefit, color}) => (
  <div className="glass-card card-hover" style={glassFeature}>
    <div style={fIcon(color)}>{icon}</div>
    <h3 style={cardH3}>{title}</h3>
    <p style={cardP}>{desc}</p>
    <div style={benefitTag}><FiCheck size={12} /> {benefit}</div>
  </div>
);

const BlogCard = ({blog}) => (
  <div style={blogCardStyle} className="blog-hover">
    <div style={blogImgWrapper}><img src={blog.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=500"} alt={blog.title} style={blogImgStyle} /></div>
    <div style={blogCardBodyStyle}>
      <div style={blogHeaderStyle}><span style={blogTagStyle}>{blog.category || 'ANALYSIS'}</span><span style={blogDateStyle}>5 min read</span></div>
      <h4 style={blogTitleStyle}>{blog.title}</h4>
      <Link to={`/blog/${blog._id}`} style={readMoreLinkStyle}>Read Report <FiArrowRight /></Link>
    </div>
  </div>
);

// --- 🎨 PRODUCTION CSS LAYOUT STYLE OBJECTS ---
const masterContainer = { background: '#fff', color: '#0f172a', overflowX: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif' };
const navStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '25px 0', position: 'fixed', width: '100%', top: 0, zIndex: 2000, transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)' };
const navScrolled = { ...navStyle, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(15,23,42,0.06)', padding: '14px 0', boxShadow: '0 4px 30px rgba(0,0,0,0.02)' };
const navInner = { width: '90%', maxWidth: '1400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const logoWrapper = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' };
const logoIcon = { background: '#0f172a', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center' };
const logoText = { fontSize: '20px', fontWeight: '950', letterSpacing: '-1px' };
const tm = { fontSize: '8px', color: '#3b82f6', verticalAlign: 'top', fontWeight: 'bold' };
const navLinks = { display: 'none', gap: '30px', alignItems: 'center' };
const linkStyle = { textDecoration: 'none', fontSize: '13px', fontWeight: '800', transition: 'color 0.2s' };
const vDivider = { width: '1px', height: '16px', background: 'rgba(148,163,184,0.3)' };
const loginBtn = { textDecoration: 'none', fontWeight: '900', fontSize: '13px', trackingSpace: '0.5px' };
const signupBtn = { textDecoration: 'none', background: '#fff', color: '#0f172a', padding: '11px 22px', borderRadius: '12px', fontSize: '13px', fontWeight: '900', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'all 0.3s' };
const signupBtnScrolled = { ...signupBtn, background: '#0f172a', color: '#fff', boxShadow: '0 4px 20px rgba(15,23,42,0.1)' };

const heroWrapper = { minHeight: '100vh', padding: '140px 6% 80px 6%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '50px', background: '#030712', color: '#fff', position: 'relative', overflow: 'hidden' };
const heroContent = { flex: 1, position: 'relative', zIndex: 10 };
const heroTitle = { fontSize: 'clamp(42px, 5.5vw, 76px)', fontWeight: '950', lineHeight: 1.05, marginBottom: '25px', letterSpacing: '-3px' };
const heroSubText = { fontSize: '19px', color: '#94a3b8', lineHeight: '1.65', marginBottom: '40px', maxWidth: '580px', fontWeight: '500' };
const gradientText = { background: 'linear-gradient(135deg, #60a5fa 0%, #2dd4bf 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' };

const previewImg = { width: '100%', borderRadius: '0 0 12px 12px', display: 'block', objectFit: 'cover' };
const promoBadge = { display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '100px', fontSize: '10px', fontWeight: '900', marginBottom: '25px', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.25)', letterSpacing: '1px' };
const btnGroup = { display: 'flex', gap: '15px', flexWrap: 'wrap' };
const btnPrimary = { padding: '18px 32px', background: '#3b82f6', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', boxShadow: '0 10px 25px rgba(59,130,246,0.3)' };
const btnSecondary = { padding: '18px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: '800', fontSize: '14px', transition: 'all 0.2s' };

const statsWrapper = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '50px 6%', background: '#fff', borderBottom: '1px solid #e2e8f0' };
const statBoxStyle = { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' };
const statValStyle = { fontSize: '40px', fontWeight: '950', color: '#0f172a', letterSpacing: '-2px' };
const statLabStyle = { fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' };

const sectionContainer = (bg) => ({ padding: '100px 6%', background: bg, scrollMarginTop: '70px', boxSizing: 'border-box' });
const centeredHeader = { textAlign: 'center', marginBottom: '60px' };
const sectionBadge = { fontSize: '11px', fontWeight: '950', color: '#3b82f6', letterSpacing: '2.5px', marginBottom: '12px' };
const sectionTitle = { fontSize: 'clamp(30px, 4.5vw, 44px)', fontWeight: '950', letterSpacing: '-1.5px', lineHeight: 1.1, color: '#0f172a' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '25px', width: '100%', maxWidth: '1200px', margin: '0 auto' };
const glassFeature = { background: '#fff', padding: '40px 35px', borderRadius: '30px', border: '1px solid #e2e8f0', transition: 'all 0.3s' };
const fIcon = (color) => ({ width: '56px', height: '56px', background: `${color}10`, color: color, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '22px' });
const cardH3 = { fontSize: '22px', fontWeight: '950', marginBottom: '12px', color: '#0f172a', trackingSpace: '-0.5px' };
const cardP = { color: '#64748b', fontSize: '15px', lineHeight: 1.6, margin: 0 };
const benefitTag = { marginTop: '20px', fontSize: '11px', fontWeight: '900', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase' };

const aboutGlassCard = { flex: '1', minWidth: '300px', background: '#fff', padding: '35px', borderRadius: '30px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' };
const testimonialSectionStyle = { padding: '100px 6%', background: '#fff', boxSizing: 'border-box' };
const blogHeaderTop = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px', width: '100%', maxWidth: '1200px', margin: '0 auto 50px auto' };
const blogGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '25px', width: '100%', maxWidth: '1200px', margin: '0 auto' };
const blogCardStyle = { borderRadius: '26px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.3s' };
const blogImgWrapper = { width: '100%', height: '210px', overflow: 'hidden', background: '#f1f5f9' };
const blogImgStyle = { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' };
const blogCardBodyStyle = { padding: '25px' };
const blogHeaderStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' };
const blogTagStyle = { fontSize: '9px', fontWeight: '950', color: '#3b82f6', background: '#eff6ff', padding: '5px 12px', borderRadius: '8px', trackingSpace: '0.5px' };
const blogDateStyle = { fontSize: '11px', color: '#94a3b8', fontWeight: '700' };
const blogTitleStyle = { fontSize: '18px', fontWeight: '950', marginBottom: '15px', lineHeight: '1.35', color: '#0f172a' };
const readMoreLinkStyle = { textDecoration: 'none', color: '#0f172a', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' };

const contactInfoRow = { display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '18px', borderRadius: '20px', border: '1px solid #e2e8f0' };
const contactMiniLabel = { display: 'block', fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', trackingSpace: '0.5px' };
const contactAnchorLink = { fontSize: '14px', color: '#0f172a', textDecoration: 'none', fontWeight: '900', trackingSpace: '-0.3px' };
const contactFormBox = { flex: '1.5', minWidth: '320px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' };
const contactInlineInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: '700', outline: 'none', color: '#0f172a', boxSizing: 'border-box', transition: 'border 0.2s' };
const contactSubmitBtn = { width: '100%', padding: '15px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' };

const ctaSection = { padding: '80px 6%', boxSizing: 'border-box', background: '#fff' };
const ctaCard = { background: '#090d16', borderRadius: '40px', padding: '70px 30px', textAlign: 'center', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.15)' };
const ctaTitle = { fontSize: '42px', fontWeight: '950', marginBottom: '18px', lineHeight: 1.1, trackingSpace: '-1px' };
const ctaText = { color: '#94a3b8', fontSize: '17px', marginBottom: '35px', fontWeight: '500' };
const btnPrimaryLarge = { ...btnPrimary, display: 'inline-flex', padding: '22px 45px', fontSize: '16px', borderRadius: '16px' };

// 🔥 UPDATED RE-ENGINEERED STRUCTURAL FOOTER THEME SYSTEM
const footerStyle = { background: '#020617', color: '#fff', padding: '90px 6% 35px 6%', borderTop: '1px solid #1e293b', boxSizing: 'border-box' };
const footerMain = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '45px', marginBottom: '70px', width: '100%', maxWidth: '1300px', margin: '0 auto 70px auto' };
const fBrandStyle = { display: 'flex', flexDirection: 'column', gap: '15px' }; 
const fLogo = { fontSize: '22px', fontWeight: '950', color: '#fff', letterSpacing: '-1px', margin: 0 };
const fText = { color: '#64748b', fontSize: '13px', lineHeight: '1.6', margin: 0, fontWeight: '500' };
const footerSecurityBadge = { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', padding: '8px 12px', borderRadius: '10px', fontSize: '9px', fontWeight: '900', color: '#10b981', alignSelf: 'flex-start', marginTop: '5px' };
const fColumnStyle = { display: 'flex', flexDirection: 'column', gap: '12px' }; 
const fHeadingStyle = { fontWeight: '900', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', trackingSpace: '1px', color: '#94a3b8' }; 
const fLinkStyle = { color: '#64748b', fontSize: '13px', fontWeight: '700', textDecoration: 'none', transition: 'color 0.2s', alignSelf: 'flex-start' }; 
const fLinkStyleActive = { ...fLinkStyle, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' };
const fLinkStyleStatic = { color: '#475569', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' };
const fBottom = { borderTop: '1px solid #1e293b', paddingTop: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', color: '#475569', fontSize: '12px', fontWeight: '700', width: '100%', maxWidth: '1300px', margin: '0 auto' };
const footerTickerWrapper = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', color: '#64748b' };

const mobileToggleStyle = { cursor: 'pointer', display: 'none', zIndex: 3000 };
const mobileDropdownStyle = { position: 'fixed', inset: 0, background: '#020617', padding: '110px 40px', display: 'flex', flexDirection: 'column', gap: '25px', zIndex: 2500 };
const mobLink = { textDecoration: 'none', color: '#fff', fontSize: '22px', fontWeight: '900', uppercase: 'true' };
const mobBtn = { ...mobLink, color: '#3b82f6' };
const noData = { textAlign: 'center', padding: '50px', color: '#cbd5e1', fontWeight: '900', width: '100%' };
const avatarStyle = { width: '70px', height: '70px', borderRadius: '50%', marginBottom: '18px', border: '3px solid #f1f5f9', objectFit: 'cover' };
const contactLink = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#0f172a', textDecoration: 'none', marginBottom: '10px' };

const animations = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');
  body { scroll-behavior: smooth; margin: 0; background: #fff; }
  .animated-mesh { position: absolute; width: 100%; height: 100%; background: radial-gradient(at 80% 10%, #0f172a 0px, transparent 60%), radial-gradient(at 10% 90%, #020617 0px, transparent 60%); opacity: 0.9; z-index: 1; }
  
  /* 🔥 MODERN CYBER ORBS KINETICS BACKGROUND */
  .glow-orborb-one { position: absolute; width: 450px; height: 450px; background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%); top: -10%; right: -5%; z-index: 2; animation: floatOrb 8s ease-in-out infinite; }
  .glow-orborb-two { position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%); bottom: -10%; left: -5%; z-index: 2; animation: floatOrb 12s ease-in-out infinite alternate; }
  @keyframes floatOrb { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(30px, -20px) scale(1.05); } }

  .browser-mockup { width: 100%; max-width: 600px; border-radius: 16px; background: #0b0f19; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 40px 80px -15px rgba(0,0,0,0.7); overflow: hidden; }
  .browser-header { height: 38px; background: #05070f; display: flex; align-items: center; padding: 0 16px; gap: 8px; border-b: 1px solid rgba(255,255,255,0.02); }
  .browser-header .dot { width: 9px; height: 9px; border-radius: 50%; }
  .dot.red { background: #ef4444; } .dot.yellow { background: #f59e0b; } .dot.green { background: #10b981; }
  .address-bar { flex: 1; background: #0b0f19; height: 22px; border-radius: 8px; margin-left: 10px; display: flex; align-items: center; padding: 0 12px; font-size: 10px; color: #475569; font-family: monospace; border: 1px solid rgba(255,255,255,0.03); }

  @media (min-width: 901px) { .desktop-menu { display: flex !important; } .hero-image-container { display: flex !important; flex: 1; justify-content: flex-end; } }
  @media (max-width: 900px) { 
    .mobile-toggle { display: block !important; } 
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .hero-image-container { display: none; }
    .hero-btns { flex-direction: column; }
    .hero-btns a { width: 100%; text-align: center; justify-content: center; }
  }
  
  .desktop-menu a:hover { color: #0f172a !important; }
  nav a { transition: color 0.25s ease; }
  .blog-hover:hover img { transform: scale(1.06); }
  .blog-hover:hover { border-color: #cbd5e1 !important; box-shadow: 0 12px 30px rgba(0,0,0,0.02); }
  .card-hover:hover { transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgba(15,23,42,0.06); border-color: #3b82f6 !important; }
  
  .ticker-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px #10b981; animation: blink 1.5s infinite; }
  @keyframes blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

  .pulse-dot { width: 7px; height: 7px; background: #3b82f6; border-radius: 50%; display: inline-block; margin-right: 10px; box-shadow: 0 0 0 0 rgba(59,130,246,0.6); animation: pulse 2s infinite; }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.6); } 70% { box-shadow: 0 0 0 8px rgba(59,130,246,0); } 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }
  
  input:focus, select:focus, textarea:focus { border-color: #0f172a !important; box-shadow: 0 0 0 4px rgba(15,23,42,0.04); }
  footer a:hover { color: #fff !important; }
`;

export default LandingPage;