import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Navbar from '../components/Navbar/Navbar';
import { FiCommand, FiShield, FiActivity, FiGlobe } from 'react-icons/fi';

const AdminLayout = () => {
  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] overflow-hidden font-sans antialiased text-slate-900 select-none">
      <style>{dashboardGlobalCSS}</style>
      
      {/* =========================================================================
          1️⃣ LEFT SIDEBAR CONTAINER (Premium Midnight Architecture)
         ========================================================================= */}
      <aside className="hidden md:flex md:w-72 md:flex-shrink-0 z-30 bg-slate-900 shadow-[25px_0_50px_-15px_rgba(15,23,42,0.15)] border-r border-slate-800">
        <Sidebar />
      </aside>

      {/* =========================================================================
          2️⃣ MAIN COMPONENT STACK INTERFACE WRAPPER
         ========================================================================= */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        
        {/* FROSTED INTERACTIVE NAVIGATION NAVBAR NODE */}
        <header className="h-16 flex-shrink-0 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 z-20 sticky top-0 flex items-center px-6 transition-all duration-300">
          <Navbar />
        </header>

        {/* =========================================================================
            3️⃣ DYNAMIC CONTENT AUDIT STREAM (With Embedded Smooth Kinetics)
           ========================================================================= */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] p-6 md:p-10 scroll-smooth custom-dashboard-scroll">
          <div className="max-w-7xl mx-auto">
            
            {/* TERMINAL STATUS OVERVIEW PANEL HEADER */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/40 pb-6">
              <div className="flex items-center gap-4 animate-slide-up">
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10 hover:scale-105 transition-transform duration-300">
                  <FiCommand className="text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                    System Control
                  </h1>
                  <p className="text-[11px] text-slate-400 font-extrabold mt-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    Master Console 
                    <span className="text-slate-300">|</span> 
                    <FiGlobe className="text-indigo-500 animate-pulse" /> 
                    <span className="text-slate-600 font-black">Prayagraj Hub</span>
                  </p>
                </div>
              </div>

              {/* LIVE NETWORK NETWORK TELEMETRY NODES */}
              <div className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                 <div className="flex flex-col items-end px-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Status</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-[11px] mt-0.5">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-ping"></span> 
                       Encrypted & Online
                    </span>
                 </div>
                 
                 <div className="h-10 w-[1px] bg-slate-200 hidden md:block mx-1"></div>
                 
                 <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors duration-200">
                    <FiShield className="text-slate-900 text-sm" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Super Admin</span>
                 </div>
              </div>
            </div>

            {/* DYNAMIC SUB-PAGE CONTAINER INJECTION IN VITE PIPELINES */}
            <div className="content-page-entrance-container">
              <Outlet />
            </div>
          </div>
        </main>

        {/* =========================================================================
            4️⃣ SECURE VAULT METRICS MINI FOOTER TERMINAL
           ========================================================================= */}
        <footer className="h-12 bg-white border-t border-slate-200/60 px-8 flex items-center justify-between text-[10px] font-black text-slate-400 select-none flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"></div>
              <span className="text-slate-900 uppercase tracking-widest">D-Finance Enterprise v3.0</span>
            </div>
            <span className="hidden md:inline px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md border border-slate-100 uppercase tracking-wider">
               COMPLIANCE PIPELINE: ISO-27001
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md border border-emerald-100">
               <FiActivity className="text-xs" /> 
               <span className="font-mono tracking-tighter">LATENCY: 24ms</span>
            </div>
            <span className="text-slate-200 hidden sm:inline">|</span>
            <span className="hover:text-slate-900 cursor-help transition-colors hidden sm:inline uppercase tracking-wider">Help Documentation Hub</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

// =========================================================================
// 🎨 HARDWARE ACCELERATED ANIMATIONS AND CLEAN INTERFACE SCROLL STYLING
// =========================================================================
const dashboardGlobalCSS = `
  /* High-Readability Smooth Scroll Configuration Matrix */
  .custom-dashboard-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-dashboard-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-dashboard-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 100px;
  }
  .custom-dashboard-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Structural Hardware-Accelerated Kinetic Keyframes */
  .content-page-entrance-container {
    animation: dashboardPageEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: transform, opacity;
  }

  .animate-slide-up {
    animation: layoutHeaderSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes dashboardPageEntrance {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.995);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes layoutHeaderSlide {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default AdminLayout;