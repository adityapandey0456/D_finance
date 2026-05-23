import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { 
  FiCalendar, FiArrowDownCircle, FiFilter, FiRefreshCw, FiPrinter, 
  FiCheckSquare, FiUser, FiDollarSign, FiClock, FiActivity, FiUsers, 
  FiTrendingUp, FiTrendingDown, FiCheck
} from 'react-icons/fi';

const DailyCollectionReport = () => {
  const [activeTab, setActiveTab] = useState('todo'); // Default view is Todo List
  const [collections, setCollections] = useState([]);
  const [allLoansData, setAllLoansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  const [filterMode, setFilterMode] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState("");

  // 🗓️ Weekly Day Navigation Selection (Default to Today's Day Name)
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedTodoDay, setSelectedTodoDay] = useState(todayDayName); 
  const [markingId, setMarkingId] = useState(null);

  // Weekly System Counter Stats
  const [weeklyStats, setWeeklyStats] = useState({
    newLeadsThisWeek: 0,
    activeEmiCount: 0,
    totalPaidWeek: 0,
    totalPendingWeek: 0
  });

  // generate 7 days array starting from Monday for layout rendering
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      
      const [resReport, resAllLoans] = await Promise.all([
        API.get('/admin/collection-report').catch(() => ({ data: [] })),
        API.get('/admin/all-loans').catch(() => ({ data: [] }))
      ]);
      
      // 1. Ledger Data Process
      const reportData = Array.isArray(resReport.data) ? resReport.data : [];
      const sortedData = reportData.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      setCollections(sortedData);
      
      const total = reportData.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      setTotalToday(total);

      // Save global loans database object
      const allLoans = Array.isArray(resAllLoans.data) ? resAllLoans.data : [];
      setAllLoansData(allLoans);

      // 2. Metrics Engine Engine
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyLoans = allLoans.filter(loan => new Date(loan.createdAt) >= oneWeekAgo);
      const weeklyPaid = allLoans.reduce((sum, l) => sum + (l.totalPaid || 0), 0);
      const weeklyPending = allLoans.reduce((sum, l) => sum + (l.totalPending || 0), 0);

      setWeeklyStats({
        newLeadsThisWeek: weeklyLoans.length,
        activeEmiCount: allLoans.filter(l => l.status === 'Disbursed').length,
        totalPaidWeek: weeklyPaid,
        totalPendingWeek: weeklyPending
      });

    } catch (err) {
      console.error("Master Sync Engine Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Action to complete task and push repayment data to db
  const handleCheckmarkEMI = async (loan) => {
    if (markingId) return;
    const confirmPayment = window.confirm(`Collect standard installment of ₹${loan.installmentAmount} from ${loan.customerName}?`);
    if (!confirmPayment) return;

    try {
      setMarkingId(loan._id);
      const response = await API.post(`/admin/approve-direct-repayment`, {
        loanId: loan.loanId,
        amount: loan.installmentAmount,
        utr: `WEEK_TODO_CASH_${Date.now()}`
      });

      if (response.data.success) {
        alert("🎉 EMI Balance Collected & Logs Refreshed!");
        fetchReport();
      }
    } catch (err) {
      alert("❌ Operational Sync Failed. Check cloud network database hooks.");
    } finally {
      setMarkingId(null);
    }
  };

  // Helper calculation engine to get headcount per specific day inside tabs
  const getCountForDay = (dayName) => {
    return allLoansData.filter(loan => {
      if (loan.status !== 'Disbursed') return false;
      if (loan.emiType === 'Daily EMI') return true;
      if (loan.emiType === 'Weekly EMI') {
        const appliedDay = new Date(loan.appliedDate).toLocaleDateString('en-US', { weekday: 'long' });
        return appliedDay === dayName;
      }
      return false;
    }).length;
  };

  // 🔥 Filtering logic specific to selected tab day name
  const filteredTodos = allLoansData.filter(loan => {
    if (loan.status !== 'Disbursed') return false;
    
    // Search constraints matching logic
    const matchesSearch = (loan.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
                          (loan.loanId?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (loan.emiType === 'Daily EMI') return true;
    if (loan.emiType === 'Weekly EMI') {
      const appliedDay = new Date(loan.appliedDate).toLocaleDateString('en-US', { weekday: 'long' });
      return appliedDay === selectedTodoDay;
    }
    return false;
  });

  const filteredCollections = collections.filter(item => {
    const matchesSearch = (item.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
                          (item.loanId?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesMethod = filterMode === 'All' ? true : item.method === filterMode;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="p-3 sm:p-6 space-y-6 bg-[#f8fafc] min-h-screen box-border pb-24">
      
      {/* --- HUD: MAIN HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shrink-0 shadow-md shadow-blue-100">
              <FiCalendar size={24} />
          </div>
          <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase truncate">D-Finance Terminal</h2>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1 italic whitespace-nowrap">
                Node: Mathura_Core | Live Collection Engine
              </p>
          </div>
        </div>

        <div className="flex flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 sm:flex-none bg-slate-900 text-white px-5 sm:px-6 py-3.5 rounded-2xl flex items-center gap-3 shadow-md">
            <FiArrowDownCircle className="text-emerald-400 shrink-0" size={18}/>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-black uppercase opacity-60 tracking-widest whitespace-nowrap">Gross Recovery Today</span>
              <span className="text-base sm:text-lg font-black tabular-nums truncate">₹{totalToday.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button onClick={fetchReport} className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* --- SERVICE ENGINE NAVIGATION SWITCHER --- */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl w-full max-w-md overflow-x-auto gap-1">
        <button onClick={() => setActiveTab('todo')} className={`flex-1 text-center py-3 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === 'todo' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 font-bold'}`}>
          📋 Weekly Todo Targets
        </button>
        <button onClick={() => setActiveTab('ledger')} className={`flex-1 text-center py-3 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 font-bold'}`}>
          Cloud Ledger
        </button>
        <button onClick={() => setActiveTab('weekly')} className={`flex-1 text-center py-3 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === 'weekly' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 font-bold'}`}>
          Performance Audit
        </button>
      </div>

      {/* --- GLOBAL SEARCH AND FILTER BAR --- */}
      {activeTab !== 'weekly' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
          <div className="w-full sm:w-auto">
            {activeTab === 'ledger' && (
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto gap-1">
                {['All', 'UPI', 'Cash', 'Bank'].map((mode) => (
                  <button key={mode} onClick={() => setFilterMode(mode)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterMode === mode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}>
                    {mode}
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'todo' && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-wider block text-center sm:text-left border border-emerald-100/50">
                ⚡ Mode: Dynamic Week-Day Router Sheet Active
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Filter Client Name or File ID..." className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm focus:ring-2 ring-blue-500/20" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      )}

      {/* --- CONTROLLER VIEWPORT DATA MATRIX RENDERS --- */}
      {loading ? (
        <div className="bg-white rounded-[2rem] p-24 border flex flex-col items-center justify-center gap-3">
          <FiRefreshCw className="animate-spin text-blue-600" size={32} />
          <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Calling Mainframe Nodes...</p>
        </div>
      ) : (
        <>
          {/* 📋 VIEW NODE 1: WEEKLY ROUTED TODO COMPONENT GRID */}
          {activeTab === 'todo' && (
            <div className="space-y-6">
              
              {/* 🔥 HORIZONTAL 7-DAYS TIMELINE NAVIGATION RAIL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Select Target Day Sheet</label>
                <div className="flex flex-row gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                  {daysOfWeek.map((day) => {
                    const count = getCountForDay(day);
                    const isToday = day === todayDayName;
                    const isSelected = day === selectedTodoDay;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedTodoDay(day)}
                        className={`p-3 rounded-2xl min-w-[95px] flex-1 text-center transition-all border snap-start flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10'
                            : 'bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-tight flex items-center gap-1">
                          {day.substring(0, 3)}
                          {isToday && <span className="w-1 h-1 rounded-full bg-blue-500 inline-block"></span>}
                        </span>
                        <span className={`text-[9px] font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {count} Files
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day Title Summary Header Sheet */}
              <div className="bg-slate-900 text-white px-5 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex justify-between items-center shadow-sm">
                <span className="flex items-center gap-2"><FiClock className="text-blue-400"/> Operational Route: {selectedTodoDay} Schedule</span>
                <span className="bg-white/10 px-3 py-1 rounded-md text-[10px] text-emerald-400 font-mono">{filteredTodos.length} Active Targets</span>
              </div>

              {/* RESPONSIVE TODOLIST CARDS TARGET ARCHITECTURE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTodos.map((loan) => (
                  <div key={loan._id} className="bg-white border border-slate-200 rounded-[1.8rem] p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-all min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-3 mb-4">
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 uppercase text-sm sm:text-base tracking-tight truncate">{loan.customerName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">FILE CODE: {loan.loanId}</p>
                        </div>
                        <span className="bg-blue-50 text-blue-600 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                          {loan.emiType}
                        </span>
                      </div>

                      {/* Numeric Metrics Matrix layout */}
                      <div className="grid grid-cols-2 gap-4 border-y border-slate-100 my-4 py-3.5 text-xs">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider mb-1">EMI Installment</span>
                          <b className="text-slate-900 text-base font-black italic">₹{loan.installmentAmount}</b>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider mb-1">Total Outstanding</span>
                          <b className="text-rose-600 text-base font-black tabular-nums">₹{(loan.totalPending || 0).toLocaleString()}</b>
                        </div>
                      </div>
                    </div>

                    {/* Instant Checkmark Verification Hook */}
                    <button 
                      onClick={() => handleCheckmarkEMI(loan)}
                      disabled={markingId === loan._id}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${
                        markingId === loan._id 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 active:scale-95'
                      }`}
                    >
                      {markingId === loan._id ? <FiRefreshCw className="animate-spin" /> : <FiCheckSquare size={15} />}
                      {markingId === loan._id ? "Verifying Token..." : "Mark as Collected"}
                    </button>
                  </div>
                ))}
                
                {filteredTodos.length === 0 && (
                  <div className="col-span-full bg-white p-20 text-center rounded-[2rem] border border-slate-200">
                    <p className="text-4xl mb-3">🎉</p>
                    <h4 className="font-black text-slate-300 uppercase text-xs tracking-widest">No outstanding recovery entries registered for {selectedTodoDay}!</h4>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 📊 VIEW NODE 2: CLOUD RECOVERY TRANSACTION LEDGER */}
          {activeTab === 'ledger' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-100">
                      <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                      <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer / File</th>
                      <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference Code</th>
                      <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Recd Amt</th>
                      <th className="px-6 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Channel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {filteredCollections.map((pay) => (
                      <tr key={pay._id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-5 whitespace-nowrap text-xs font-bold tabular-nums">
                          {new Date(pay.paymentDate || pay.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-6 py-5 min-w-[180px]">
                          <div className="font-black text-slate-900 uppercase text-xs sm:text-sm">{pay.customerName}</div>
                          <div className="text-[9px] text-slate-400 font-bold mt-0.5">ID: {pay.loanId}</div>
                        </td>
                        <td className="px-6 py-5">
                          <code className="text-[10px] font-mono text-blue-600 bg-blue-50/40 px-2 py-0.5 rounded border border-blue-100">{pay.utr || 'CASH_REC'}</code>
                        </td>
                        <td className="px-6 py-5 font-black text-emerald-600 tabular-nums">₹{pay.amount}</td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black uppercase text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            {pay.method || 'CASH'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredCollections.length === 0 && <TableEmptyState />}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 📈 VIEW NODE 3: WEEKLY SUMMARY PERFORMANCE AUDIT */}
          {activeTab === 'weekly' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <WeeklyStatCard label="Leads Opened (7 Days)" val={weeklyStats.newLeadsThisWeek} desc="New accounts onboarded" icon={<FiUsers/>} color="text-blue-600" bg="bg-blue-50" />
                <WeeklyStatCard label="Active EMI Pipelines" val={weeklyStats.activeEmiCount} desc="Running ledger counts" icon={<FiActivity/>} color="text-indigo-600" bg="bg-indigo-50" />
                <WeeklyStatCard label="Gross Paid Volume" val={`₹${weeklyStats.totalPaidWeek.toLocaleString('en-IN')}`} desc="Successfully settled accounts" icon={<FiTrendingUp/>} color="text-emerald-600" bg="bg-emerald-50" />
                <WeeklyStatCard label="Outstanding Debt" val={`₹${weeklyStats.totalPendingWeek.toLocaleString('en-IN')}`} desc="Pending principal + interest" icon={<FiTrendingDown/>} color="text-rose-600" bg="bg-rose-50" />
              </div>

              <div className="bg-white border border-slate-200/70 p-6 rounded-[2rem] shadow-sm">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Pipeline Asset Capital Distribution</h4>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
                  <div style={{ width: `${(weeklyStats.totalPaidWeek / (weeklyStats.totalPaidWeek + weeklyStats.totalPendingWeek || 1)) * 100}%` }} className="bg-emerald-500 h-full transition-all"></div>
                  <div style={{ width: `${(weeklyStats.totalPendingWeek / (weeklyStats.totalPaidWeek + weeklyStats.totalPendingWeek || 1)) * 100}%` }} className="bg-rose-500 h-full transition-all"></div>
                </div>
                <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 text-[10px] font-black uppercase text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span> Recovered Net Share</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span> Unrecovered NPA Share</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Stateless Sub-Card Utilities Layout 
const WeeklyStatCard = ({ label, val, desc, icon, color, bg }) => (
  <div className={`p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center gap-4 hover:shadow-md transition-all`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} ${bg} text-xl shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider truncate">{label}</span>
      <h3 className={`text-lg sm:text-xl font-black ${color} tracking-tight italic truncate my-0.5`}>{val}</h3>
      <p className="text-[9px] font-bold text-slate-400 truncate">{desc}</p>
    </div>
  </div>
);

const TableEmptyState = () => (
  <tr>
    <td colSpan="5" className="p-20 text-center">
      <div className="text-4xl mb-4 grayscale opacity-30">📭</div>
      <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">No Transactions Found</h3>
    </td>
  </tr>
);

export default DailyCollectionReport;