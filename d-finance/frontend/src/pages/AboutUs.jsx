import React from 'react';
import { FiShield, FiTarget, FiUsers, FiCpu, FiCheckCircle, FiPhone, FiGlobe } from 'react-icons/fi';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] pt-24 pb-16 px-6 md:px-12 font-sans text-slate-800 selection:bg-slate-900 selection:text-white">
      
      {/* --- HERO HEADER --- */}
      <div className="max-w-5xl mx-auto text-center mb-16">
        <span className="text-xs font-black text-indigo-600 tracking-[0.25em] uppercase bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
          Corporate Overview
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase mt-6 mb-4">
          The Infrastructure Behind <br />
          <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Digital Lending Architecture</span>
        </h1>
        <p className="text-base md:text-lg text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
          D-Finance is an institutional-grade fin-tech pipeline built to standardize credit delivery, 
          automate risk mitigation, and guarantee absolute data synchronization across decentralized distributed ledgers.
        </p>
      </div>

      {/* --- CORE OPERATIONS GRID --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-6">
              <FiTarget size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Our Operational Mission</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Our framework is engineered to optimize credit evaluation cycles for micro-lending ecosystems. By providing field officers 
              and administrators with automated compliance tools, live geotag anti-fraud verification, and instant balance amortization, 
              we drive financial transparency while containing default parameters inside an error-free registry.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-wider">
            <FiCheckCircle /> Automated Lifecycle Tracking
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6">
              <FiGlobe size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">The Prayagraj Hub Center</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Operating as our primary technological node, the Prayagraj Branch orchestrates core security clearances, 
              identity cross-referencing pipelines, and regional liquidity deployments. Every file verified here binds 
              under strict compliance standards, protecting both institutional capital and borrower data integrity.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-wider">
            <FiShield /> SECURE-NODE AES-256 ENCRYPTED
          </div>
        </div>
      </div>

      {/* --- STRATEGIC COMPLIANCE STANDARDS --- */}
      <div className="max-w-6xl mx-auto bg-slate-900 text-white rounded-[3rem] p-8 md:p-12 border border-slate-800 shadow-xl mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-1">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Platform Pillars</span>
            <h3 className="text-3xl font-black uppercase tracking-tight leading-none text-white">System Compliance Protocols</h3>
            <p className="text-slate-400 text-xs font-semibold mt-3 leading-relaxed">
              D-Finance operates under strict banking integration parameters, implementing three core operational guidelines to eliminate capital leakage.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <div className="text-indigo-400 font-mono font-black text-xs uppercase tracking-widest mb-1">Protocol 01</div>
              <h4 className="font-bold text-sm text-white uppercase mb-2">Zero-Disclosure Biometrics</h4>
              <p className="text-slate-400 text-xs leading-normal">Rigorous KYC processing workflows cross-verify credentials smoothly without keeping raw visual logs exposed to external networks.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <div className="text-emerald-400 font-mono font-black text-xs uppercase tracking-widest mb-1">Protocol 02</div>
              <h4 className="font-bold text-sm text-white uppercase mb-2">Geotag Coordinates Auditing</h4>
              <p className="text-slate-400 text-xs leading-normal">Every single disbursement request must match precise GPS tracking coordinates to protect field operations from identity spoofing.</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- LEADERSHIP REGISTER --- */}
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-12">Executive Board & Governance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <FounderProfileCard name="Dhiraj Sharma" role="Co-Founder & Director" desc="Overseeing architecture, product scalability, and secure infrastructure orchestration paths." phone="+91 89350 60000" />
          <FounderProfileCard name="Pawan Sharma" role="Team Manager" desc="Standardizing operational performance protocols, field verification rules, and team tracking indices." phone="+91 91513 63738" />
          <FounderProfileCard name="Pradeep Sharma" role="Operational & Financial Manager" desc="Supervising credit auditing frameworks, ledger balance settlement engines, and resource optimization." phone="+91 74092 34299" />
        </div>
      </div>
    </div>
  );
};

const FounderProfileCard = ({ name, role, desc, phone }) => (
  <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] text-left shadow-sm hover:border-indigo-500 hover:shadow-xl transition-all duration-300">
    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-black text-lg mb-4 uppercase">
      {name.charAt(0)}
    </div>
    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{name}</h4>
    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 mb-3">{role}</p>
    <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors mb-3">
      <FiPhone size={12} /> {phone}
    </a>
    <p className="text-slate-400 font-medium text-xs leading-relaxed">{desc}</p>
  </div>
);

export default AboutUs;