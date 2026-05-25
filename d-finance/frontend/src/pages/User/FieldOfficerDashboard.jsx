import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import API from '../../api/axios'; 
import { 
  FiZap, FiPieChart, FiRefreshCw, FiPlus, FiBox, 
  FiChevronRight, FiX, FiList, FiMapPin, FiPhone
} from 'react-icons/fi';

const FieldOfficerDashboard = () => {
  const navigate = useNavigate(); 
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingCommission: 0,
    activeAssignments: 0,
    recentSubmissions: []
  });
  const [openPool, setOpenPool] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false); // History Modal State

  const user = JSON.parse(localStorage.getItem('user')) || {};

  const fetchOfficerData = useCallback(async () => {
    try {
      setLoading(true);
      const [resDashboard, resPool] = await Promise.all([
        API.get('/admin/all-loans'),
        API.get('/officer/available-requests')
      ]);

      const allLoans = resDashboard.data || [];
      const mySubmissions = allLoans.filter(loan => 
        String(loan.fieldOfficerId) === String(user._id || user.id) || 
        loan.fieldOfficerName === user.fullName ||
        loan.verifiedByName === user.fullName
      );

      const disbursedAmount = mySubmissions
        .filter(l => l.status === 'Disbursed')
        .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

      setStats({
          totalSales: disbursedAmount,
          pendingCommission: disbursedAmount * 0.02,
          activeAssignments: mySubmissions.filter(l => !['Disbursed', 'Rejected', 'Closed'].includes(l.status)).length,
          recentSubmissions: mySubmissions 
      });

      setOpenPool(resPool.data || []);
    } catch (err) {
      console.error("❌ Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user._id, user.id, user.fullName]);

  useEffect(() => {
    fetchOfficerData();
  }, [fetchOfficerData]);

  const handleAcceptLoan = async (loanId) => {
    if(!window.confirm(`Claim Loan ${loanId}?`)) return;
    try {
      const res = await API.post(`/officer/accept-loan/${loanId}`);
      if (res.data.success) {
        alert("🎉 Lead Claimed!");
        fetchOfficerData(); 
      }
    } catch (err) { alert("❌ Error: Lead already claimed."); }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4">
      <FiRefreshCw className="animate-spin text-emerald-600" size={40} />
      <p className="mt-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Syncing Real-time Ledger...</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#f8fafc] min-h-screen font-sans pb-24 box-sizing">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter italic uppercase">OFFICER TERMINAL</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
             Agent: <span className="text-emerald-600 break-all">{user.fullName}</span>
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => navigate('/user/register-customer')} className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-slate-800 active:scale-95 transition-all text-center tracking-wider">
            + Register Lead
          </button>
          <button onClick={fetchOfficerData} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-emerald-600 active:scale-95 transition-all shadow-sm">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Analytics Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
        <StatCard label="Total Disbursed" val={`₹${stats.totalSales.toLocaleString()}`} icon={<FiPieChart/>} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Earnings (2%)" val={`₹${stats.pendingCommission.toLocaleString()}`} icon={<FiZap/>} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Active Files" val={stats.activeAssignments} icon={<FiBox/>} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {/* LEAD MARKET POOL SECTION */}
<div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 md:p-10 text-white shadow-2xl mb-10 overflow-hidden">
  <div className="flex flex-row justify-between items-center mb-8 gap-4">
    <h3 className="text-lg sm:text-xl font-black uppercase tracking-tighter flex items-center gap-2">
      <span className="text-emerald-400 animate-pulse shrink-0">●</span> Lead Market Pool
    </h3>
    <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap">
      {openPool?.length || 0} available
    </span>
  </div>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {openPool?.slice(0, 6).map((loan) => {
      const hasValidGPS = loan?.coordinates?.lat && loan?.coordinates?.lng;
      const phoneNumber = loan?.customerMobile || loan?.customerId?.mobile;

      return (
        <div key={loan.loanId || loan._id} className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-3xl hover:border-emerald-500/50 transition-all flex flex-col justify-between min-w-0">
          <div>
            <div className="flex justify-between items-start mb-4 gap-2">
              <div className="text-[9px] font-black px-2 py-1 bg-white/10 rounded-md text-slate-300 uppercase truncate">
                {loan.type || loan.emiType || 'Daily EMI'}
              </div>
              <div className="text-emerald-400 font-black text-lg italic tracking-tight shrink-0">
                ₹{loan.amount}
              </div>
            </div>
            
            <h4 className="font-black text-white uppercase truncate text-sm mb-3">
              {loan.customerName}
            </h4>

            {/* CONTACT & SECURITY GEOTAG REGISTRY */}
            <div className="flex flex-col gap-2.5 my-4 pt-3 border-t border-white/5">
              
              {/* Phone Number Row - Click to Call */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <FiPhone className="text-emerald-400 shrink-0" size={14} />
                {phoneNumber ? (
                  <a href={`tel:${phoneNumber}`} className="font-bold text-emerald-400 hover:underline tracking-wider truncate">
                    {phoneNumber}
                  </a>
                ) : (
                  <span className="font-medium tracking-wider truncate">No Number Provided</span>
                )}
              </div>

              {/* Dynamic Location / Live Maps */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <FiMapPin className="text-emerald-400 shrink-0" size={14} />
                <span className="font-medium truncate block w-full">
                  {hasValidGPS ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${loan.coordinates.lat},${loan.coordinates.lng}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-400 font-bold underline hover:text-emerald-300 transition-all flex items-center gap-1"
                    >
                      📍 View Live Geotag Map
                    </a>
                  ) : (
                    loan?.branchName || loan?.locationName || "Location Not Provided"
                  )}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => handleAcceptLoan(loan.loanId)} 
            className="w-full mt-4 bg-emerald-500 text-slate-900 font-black py-3.5 rounded-xl text-[10px] uppercase shadow-lg active:scale-95 hover:bg-emerald-400 transition-all tracking-wider shrink-0"
          >
            Claim Lead
          </button>
        </div>
      );
    })}
  </div>
</div>
      {/* Recent History Section */}
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 sm:p-6 md:p-8 border-b border-slate-50 flex flex-row justify-between items-center gap-4">
          <h3 className="font-black text-slate-800 uppercase text-base sm:text-lg tracking-tighter italic">Recent Submissions</h3>
          <button 
            onClick={() => setShowAllHistory(true)}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-100 active:scale-95 transition-all shrink-0"
          >
            <FiList /> View All
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {stats.recentSubmissions.slice(0, 3).map((loan, i) => (
            <div key={i} className="p-5 sm:p-6 flex flex-row justify-between items-center hover:bg-slate-50/50 transition-all gap-4">
               <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${loan.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {loan.customerName ? loan.customerName.charAt(0) : '?'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-800 uppercase text-xs sm:text-sm tracking-tight truncate">{loan.customerName}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic truncate">
                      ₹{(loan.amount || 0).toLocaleString()} • {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
               </div>
               <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase ${
                    loan.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>{loan.status}</span>
                  <FiChevronRight className="text-slate-300" />
               </div>
            </div>
          ))}
          {stats.recentSubmissions.length === 0 && <p className="p-10 text-center text-slate-300 font-bold uppercase text-[10px]">No records found.</p>}
        </div>
      </div>

      {/* Full History Sliding Modal Layout */}
      {showAllHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full sm:max-w-xl h-full flex flex-col shadow-2xl overflow-hidden duration-300 animate-in slide-in-from-right">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex justify-between items-center gap-4 shrink-0">
              <div>
                <h3 className="font-black italic text-lg sm:text-xl uppercase tracking-tighter">Full Submission History</h3>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{stats.recentSubmissions.length} total files</p>
              </div>
              <button onClick={() => setShowAllHistory(false)} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all text-white"><FiX size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
              {stats.recentSubmissions.map((loan, i) => (
                <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3.5 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight truncate">{loan.customerName}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {loan.loanId}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shrink-0 ${
                      loan.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>{loan.status}</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-50 pt-3.5 gap-4">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Submission Date</p>
                      <p className="text-xs font-bold text-slate-600 whitespace-nowrap">{loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Principal Amount</p>
                      <p className="text-base sm:text-lg font-black text-slate-900 italic">₹{(loan.amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              {stats.recentSubmissions.length === 0 && <p className="text-center p-10 text-slate-300 font-bold uppercase text-[10px]">No history files.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Sub-Component for Analytics Layout Stability
const StatCard = ({ label, val, icon, color, bg }) => (
  <div className={`${bg} p-5 sm:p-6 md:p-8 rounded-[2rem] border border-white shadow-sm flex items-center gap-4 sm:gap-5 transition-all hover:shadow-lg hover:-translate-y-0.5 min-w-0`}>
    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${color} bg-white shadow-sm text-lg sm:text-xl shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
      <p className={`text-xl sm:text-2xl font-black tracking-tighter italic truncate ${color}`}>{val}</p>
    </div>
  </div>
);

export default FieldOfficerDashboard;