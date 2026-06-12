import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiBell, FiUser, FiSettings, 
  FiChevronDown, FiLogOut, FiMoon, FiSun, FiShield 
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 🔥 INITIALIZE ACCURATE GLOBAL SYSTEM DARK MODE PREFERENCE
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // User Data from LocalStorage
  const user = JSON.parse(localStorage.getItem('user')) || { fullName: 'Admin User', role: 'Super Admin' };

  // 🔥 CORE INTEGRATION: Sync system theme configuration with HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 🔥 FULLY WORKING SMART SEARCH ROUTER ENGINE
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const userRole = String(user.role || '').toLowerCase().trim();
    const encodedQuery = encodeURIComponent(searchQuery.trim());

    // Automatically route to the correct query station matching active role dashboard nodes
    if (userRole === 'admin') {
      navigate(`/admin/bulk-data-retrieval?search=${encodedQuery}`);
    } else if (userRole === 'accountant') {
      navigate(`/accountant/bulk-data?search=${encodedQuery}`);
    } else {
      // Fallback redirection router mapping
      console.log(`Global search initiated for query token: ${searchQuery}`);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to securely log out of the session?")) return;
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="w-full h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex items-center justify-between px-6 relative transition-colors duration-300">
      
      {/* 1️⃣ ENABLED SMART SEARCH ROUTER FIELD BAR */}
      <form onSubmit={handleSearch} className="relative group w-full max-w-md select-none">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <FiSearch className="text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors duration-200" />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Loan ID, UTR code or Member name..." 
          className="w-full pl-10 pr-16 py-2.5 bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 dark:focus:border-slate-600 transition-all duration-300"
        />
        {searchQuery.trim() && (
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2.5 py-1.5 rounded-xl font-black uppercase tracking-wider transition-transform active:scale-95"
          >
            Find
          </button>
        )}
      </form>

      {/* 2️⃣ RIGHT INTERACTIVE PLATFORM ACTIONS AREA */}
      <div className="flex items-center gap-3">
        
        {/* QUICK MANAGEMENT OVERHEAD SETDOWNS MENU */}
        <div className="relative">
          <button 
            onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsProfileOpen(false); }}
            className={`p-2.5 rounded-xl transition-all duration-200 ${isSettingsOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-inner' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <FiSettings size={17} />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-2xl shadow-slate-900/10 p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-200">
              <p className="px-3 py-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-50 dark:border-slate-700/30 mb-1">Quick Customizations</p>
              
              <button 
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isDarkMode ? <FiSun className="text-amber-500" /> : <FiMoon className="text-slate-900 dark:text-white" />}
                  <span>{isDarkMode ? 'Light Interface' : 'Midnight Interface'}</span>
                </div>
                <div className={`w-8 h-4.5 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
              </button>

              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 transition-colors">
                <FiBell className="text-slate-400" /> <span>Real-time Alerts</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {/* SECURE MASTER PROFILE DROP CONTROL HUD */}
        <div className="relative">
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsSettingsOpen(false); }}
            className="flex items-center gap-2.5 p-1 pr-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl transition-all group select-none"
          >
            <div className="relative">
              <div className="w-9 h-9 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center text-white dark:text-slate-900 shadow-md">
                <span className="text-xs font-black uppercase">{String(user.fullName || 'A').charAt(0)}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
            </div>
            
            <div className="hidden lg:block text-left">
              <p className="text-[12px] font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">{user.fullName}</p>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{user.role || 'Personnel'}</p>
            </div>
            <FiChevronDown className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} size={14} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-2xl p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 py-2.5 border-b border-slate-50 dark:border-slate-700/30 mb-1">
                 <p className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight truncate">{user.fullName}</p>
                 <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-0.5">Secure Vault Connection</p>
              </div>
              
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 transition-colors">
                <FiUser className="text-slate-400" /> Manage Dossier
              </button>
              
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 transition-colors">
                <FiShield className="text-slate-400" /> System Credentials
              </button>
              
              <div className="h-[1px] bg-slate-100 dark:bg-slate-700/40 my-1 mx-1.5"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              >
                <FiLogOut /> Terminate Session
              </button>
            </div>
          )}
        </div>

      </div>

      {/* CLICK OUTSIDE ENGINE BLOCK CAPTURER */}
      {(isProfileOpen || isSettingsOpen) && (
        <div 
          className="fixed inset-0 z-[9998] bg-transparent cursor-default" 
          onClick={() => { setIsProfileOpen(false); setIsSettingsOpen(false); }}
        ></div>
      )}
    </div>
  );
};

export default Navbar;