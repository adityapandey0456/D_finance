import React, { useState } from 'react';
import { FiPhone, FiMail, FiMapPin, FiActivity, FiMessageSquare, FiSend, FiCheckCircle } from 'react-icons/fi';

const ContactUs = () => {
  const [submissionStatus, setSubmissionStatus] = useState(false);
  const [contactData, setContactData] = useState({ fullName: '', mobile: '', email: '', queryType: 'General Support', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const numsOnly = value.replace(/[^0-9]/g, '');
      if (numsOnly.length <= 10) setContactData({ ...contactData, [name]: numsOnly });
    } else {
      setContactData({ ...contactData, [name]: value });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (contactData.mobile.length !== 10) return alert("⚠️ Please enter a valid 10-digit mobile number.");
    
    // Simulating API telemetry transit
    console.log("Transmitting Message Parameters:", contactData);
    setSubmissionStatus(true);
    setTimeout(() => {
      setSubmissionStatus(false);
      setContactData({ fullName: '', mobile: '', email: '', queryType: 'General Support', message: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] pt-24 pb-16 px-6 md:px-12 font-sans text-slate-800">
      
      {/* --- HEADER --- */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <span className="text-xs font-black text-emerald-600 tracking-[0.25em] uppercase bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          Contact Terminal
        </span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mt-6 mb-4">
          Connect with Our Support Registry
        </h1>
        <p className="text-sm md:text-base text-slate-400 font-bold max-w-xl mx-auto uppercase tracking-wider">
          Have queries regarding automated amortization variables or profile audits? Message our nodes directly.
        </p>
      </div>

      {/* --- GRID SPLIT HUB --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        
        {/* LEFT NODE: SYSTEM CHANNELS DIRECTORY */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Active Communication Channels</h3>
          
          <div className="flex gap-4 items-center bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <FiPhone size={20} />
            </div>
            <div>
              <small className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Central Telephone Directory</small>
              <a href="tel:+918935060000" className="text-sm font-black text-slate-800 hover:text-blue-600 transition-colors block mt-0.5">+91 89350 60000</a>
            </div>
          </div>

          <div className="flex gap-4 items-center bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <FiMail size={20} />
            </div>
            <div>
              <small className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Secure Mail Infrastructure</small>
              <a href="mailto:dfinance00000@gmail.com" className="text-sm font-black text-slate-800 hover:text-emerald-600 transition-colors block mt-0.5">dfinance00000@gmail.com</a>
            </div>
          </div>

          <div className="flex gap-4 items-center bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <FiMapPin size={20} />
            </div>
            <div>
              <small className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Physical Hub Node Location</small>
              <span className="text-xs font-black text-slate-800 block mt-0.5 leading-tight uppercase">Prayagraj Branch, Uttar Pradesh, India</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg">
            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FiActivity /> Telemetry Notice</h5>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              All communications processed through this portal terminal are securely logged and encrypted under token parameter configurations.
            </p>
          </div>
        </div>

        {/* RIGHT NODE: INTERACTIVE INPUT DRAFTING FORM */}
        <div className="lg:col-span-3 bg-white border border-slate-200/60 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          
          <AnimatePresence>
            {submissionStatus && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <FiCheckCircle size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Transmission Complete</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2 max-w-xs">
                  Your message parameters have successfully bypassed filters and loaded onto our admin dashboard registry stream.
                </p>
              </div>
            )}
          </AnimatePresence>

          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-2">
            <FiMessageSquare className="text-indigo-600" /> Dispatch Transmission
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                <input type="text" name="fullName" required value={contactData.fullName} onChange={handleInputChange} placeholder="e.g. Rahul Kumar" className="w-full p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/50 font-bold text-xs outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</label>
                <input type="tel" name="mobile" required value={contactData.mobile} onChange={handleInputChange} placeholder="10 Digits Only" className="w-full p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/50 font-bold text-xs outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-800" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
              <input type="email" name="email" required value={contactData.email} onChange={handleInputChange} placeholder="name@company.com" className="w-full p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/50 font-bold text-xs outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-800" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Routing Classification</label>
              <select name="queryType" value={contactData.queryType} onChange={handleInputChange} className="w-full p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/50 font-bold text-xs outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-800">
                <option value="General Support">General Support Query</option>
                <option value="Ledger Dispute">Amortization / Ledger Dispute</option>
                <option value="Advisor Collaboration">Advisor Network Clearance</option>
                <option value="Technical Bug">System / Technical Malfunction</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Message Description</label>
              <textarea name="message" required rows="4" value={contactData.message} onChange={handleInputChange} placeholder="State your data parameters or support query explicitly..." className="w-full p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/50 font-bold text-xs outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-800 resize-none font-sans" />
            </div>

            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl active:scale-[0.99] mt-6">
              <FiSend /> Transmit Message Parameters
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ContactUs;