import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import {
  FiCalendar,
  FiArrowDownCircle,
  FiFilter,
  FiRefreshCw,
  FiCheckSquare,
  FiClock,
  FiActivity,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';

const DailyCollectionReport = () => {
  const [activeTab, setActiveTab] = useState('todo');
  const [collections, setCollections] = useState([]);
  const [allLoansData, setAllLoansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  const [filterMode, setFilterMode] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [markingId, setMarkingId] = useState(null);

  const todayDayName = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const [selectedTodoDay, setSelectedTodoDay] = useState(todayDayName);

  const [weeklyStats, setWeeklyStats] = useState({
    newLeadsThisWeek: 0,
    activeEmiCount: 0,
    totalPaidWeek: 0,
    totalPendingWeek: 0,
  });

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);

      const [resReport, resAllLoans] = await Promise.all([
        API.get('/admin/collection-report').catch(() => ({ data: [] })),
        API.get('/admin/all-loans').catch(() => ({ data: [] })),
      ]);

      const reportData = Array.isArray(resReport.data)
        ? resReport.data
        : [];

      const sortedData = [...reportData].sort(
        (a, b) =>
          new Date(b.paymentDate || b.date) -
          new Date(a.paymentDate || a.date)
      );

      setCollections(sortedData);

      const total = reportData.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );

      setTotalToday(total);

      const allLoans = Array.isArray(resAllLoans.data)
        ? resAllLoans.data
        : [];

      setAllLoansData(allLoans);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyLoans = allLoans.filter(
        (loan) => new Date(loan.createdAt) >= oneWeekAgo
      );

      const weeklyPaid = allLoans.reduce(
        (sum, l) => sum + Number(l.totalPaid || 0),
        0
      );

      const weeklyPending = allLoans.reduce(
        (sum, l) => sum + Number(l.totalPending || 0),
        0
      );

      setWeeklyStats({
        newLeadsThisWeek: weeklyLoans.length,
        activeEmiCount: allLoans.filter(
          (l) => l.status === 'Disbursed'
        ).length,
        totalPaidWeek: weeklyPaid,
        totalPendingWeek: weeklyPending,
      });
    } catch (err) {
      console.error('Master Sync Engine Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleCheckmarkEMI = async (loan) => {
    if (markingId) return;

    const confirmPayment = window.confirm(
      `Log Todo Collection entry of ₹${loan.installmentAmount} for ${loan.customerName}? (This is a structural record checkoff)`
    );

    if (!confirmPayment) return;

    try {
      setMarkingId(loan._id);

      // Backend par direct repayment hit karega jo sirf record save karega, calculation nahi
      const response = await API.post(
        '/admin/approve-direct-repayment',
        {
          loanId: loan.loanId,
          amount: loan.installmentAmount,
          remarks: "Daily Target Checked off via Terminal UI Panel"
        }
      );

      if (response.data.success) {
        alert('🎉 Daily Target Checklist Status Updated!');
        fetchReport();
      }
    } catch (err) {
      console.error(err);
      alert('❌ Operational Sync Failed.');
    } finally {
      setMarkingId(null);
    }
  };

  const getCountForDay = (dayName) => {
    return allLoansData.filter((loan) => {
      if (loan.status !== 'Disbursed') return false;
      if (loan.emiType === 'Daily EMI') return true;

      if (loan.emiType === 'Weekly EMI') {
        const appliedDay = new Date(
          loan.appliedDate
        ).toLocaleDateString('en-US', {
          weekday: 'long',
        });

        return appliedDay === dayName;
      }
      return false;
    }).length;
  };

  const isOverdue = (loan) => {
    const lastDate = new Date(
      loan.lastCollectionDate || loan.appliedDate
    ).setHours(0, 0, 0, 0);

    const today = new Date().setHours(0, 0, 0, 0);
    return lastDate < today;
  };

  const filteredTodos = allLoansData.filter((loan) => {
    if (loan.status !== 'Disbursed') return false;

    const matchesSearch =
      (loan.customerName?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      ) ||
      (loan.loanId?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      );

    if (!matchesSearch) return false;
    if (loan.emiType === 'Daily EMI') return true;

    if (loan.emiType === 'Weekly EMI') {
      const appliedDay = new Date(
        loan.appliedDate
      ).toLocaleDateString('en-US', {
        weekday: 'long',
      });

      return appliedDay === selectedTodoDay;
    }

    return false;
  });

  const sortedFilteredTodos = [...filteredTodos].sort((a, b) => {
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    return Number(bOverdue) - Number(aOverdue);
  });

  // 🔥 TARGET FILTER COUNT ENGINE: Jo aaj collect ho chuke hain, unhe dynamic remaining se nikal do
  const remainingTargetsCount = filteredTodos.filter(
    (loan) => !collections.some((p) => p.loanId === loan.loanId)
  ).length;

  const filteredCollections = collections.filter((item) => {
    const matchesSearch =
      (item.customerName?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      ) ||
      (item.loanId?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      );

    const matchesMethod =
      filterMode === 'All'
        ? true
        : item.method === filterMode;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="p-3 sm:p-6 space-y-6 bg-[#f8fafc] min-h-screen box-border pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shrink-0 shadow-md shadow-blue-100">
            <FiCalendar size={24} />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">
              D-Finance Terminal
            </h2>

            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1 italic">
              Node: Mathura_Core | Daily Todo Checklist Engine
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-3">
            <FiArrowDownCircle className="text-emerald-400" />

            <div>
              <span className="text-[8px] uppercase opacity-60 block">
                Logged Collections Today
              </span>

              <span className="text-lg font-black">
                ₹{totalToday.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={fetchReport}
            className="p-3 bg-white border border-slate-200 rounded-xl"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl w-full max-w-md overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('todo')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'todo'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600'
          }`}
        >
          📋 Weekly Todo Targets
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600'
          }`}
        >
          Cloud Ledger
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'weekly'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600'
          }`}
        >
          Performance Audit
        </button>
      </div>

      {activeTab !== 'weekly' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Filter Client Name or File ID..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-[2rem] p-24 border flex flex-col items-center justify-center gap-3">
          <FiRefreshCw className="animate-spin text-blue-600" size={32} />

          <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
            Calling Mainframe Nodes...
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'todo' && (
            <div className="space-y-6">
              <div className="flex flex-row gap-2 overflow-x-auto pb-2">
                {daysOfWeek.map((day) => {
                  const count = getCountForDay(day);
                  const isToday = day === todayDayName;
                  const isSelected = day === selectedTodoDay;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedTodoDay(day)}
                      className={`p-3 rounded-2xl min-w-[95px] border transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-tight flex items-center gap-1 justify-center">
                        {day.substring(0, 3)}
                        {isToday && (
                          <span className="w-1 h-1 rounded-full bg-blue-500 inline-block"></span>
                        )}
                      </span>

                      <span className="text-[9px] font-bold block mt-1">
                        {count} Files
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-slate-900 text-white px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <FiClock className="text-blue-400" />
                  Operational Route: {selectedTodoDay} Targets
                </span>

                <span className="bg-white/10 px-3 py-1 rounded-md text-[10px] text-emerald-400 font-mono">
                  {remainingTargetsCount} Remaining / {filteredTodos.length} Total
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedFilteredTodos.map((loan) => {
                  const overdue = isOverdue(loan);
                  // 🔥 TODO CORE STATE CHECK: Agar aaj is loan ki entry ledger array me hai, yaani ye done hai
                  const isCollectedToday = collections.some((p) => p.loanId === loan.loanId);

                  return (
                    <div
                      key={loan._id}
                      className={`border rounded-[1.8rem] p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all ${
                        isCollectedToday
                          ? 'bg-slate-50/80 border-slate-200 opacity-75'
                          : overdue
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <div>
                            <h4
                              className={`font-black uppercase text-sm sm:text-base tracking-tight ${
                                isCollectedToday
                                  ? 'text-slate-500 line-through'
                                  : overdue
                                  ? 'text-rose-900'
                                  : 'text-slate-900'
                              }`}
                            >
                              {loan.customerName}
                            </h4>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              ID: {loan.loanId}
                            </p>
                          </div>

                          {isCollectedToday ? (
                            <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                              Done Today
                            </span>
                          ) : overdue ? (
                            <span className="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                              Overdue
                            </span>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-y border-slate-100 my-4 py-3.5 text-xs">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 block uppercase mb-1">
                              Installment
                            </span>

                            <b
                              className={`text-base font-black ${
                                isCollectedToday
                                  ? 'text-slate-400'
                                  : overdue
                                  ? 'text-rose-700'
                                  : 'text-slate-900'
                              }`}
                            >
                              ₹{loan.installmentAmount}
                            </b>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-black text-slate-400 block uppercase mb-1">
                              Outstanding
                            </span>

                            <b className="text-rose-600 text-base font-black tabular-nums">
                              ₹{(loan.totalPending || 0).toLocaleString()}
                            </b>
                          </div>
                        </div>
                      </div>

                      {/* 🔥 CHECKBOX TOGGLE BUTTON */}
                      <button
                        onClick={() => handleCheckmarkEMI(loan)}
                        disabled={markingId === loan._id || isCollectedToday}
                        className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                          isCollectedToday
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : overdue
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
                        }`}
                      >
                        {markingId === loan._id
                          ? 'Syncing...'
                          : isCollectedToday
                          ? '✓ Checked off Today'
                          : overdue
                          ? 'Collect Overdue'
                          : 'Mark as Collected'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-5 text-[9px] font-black uppercase">
                        Time
                      </th>
                      <th className="px-6 py-5 text-[9px] font-black uppercase">
                        Customer
                      </th>
                      <th className="px-6 py-5 text-[9px] font-black uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCollections.map((pay) => (
                      <tr key={pay._id} className="border-b border-slate-100">
                        <td className="px-6 py-4 text-xs font-bold">
                          {new Date(
                            pay.paymentDate || pay.date
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-black text-sm">
                            {pay.customerName}
                          </div>

                          <div className="text-[10px] text-slate-400">
                            {pay.loanId}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-black text-emerald-600">
                          ₹{pay.amount}
                        </td>
                      </tr>
                    ))}

                    {filteredCollections.length === 0 && (
                      <TableEmptyState />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <WeeklyStatCard
                label="Leads Opened"
                val={weeklyStats.newLeadsThisWeek}
                desc="New accounts onboarded"
                icon={<FiUsers />}
                color="text-blue-600"
                bg="bg-blue-50"
              />

              <WeeklyStatCard
                label="Active EMI Pipelines"
                val={weeklyStats.activeEmiCount}
                desc="Running ledger counts"
                icon={<FiActivity />}
                color="text-indigo-600"
                bg="bg-indigo-50"
              />

              <WeeklyStatCard
                label="Gross Paid Volume"
                val={`₹${weeklyStats.totalPaidWeek.toLocaleString('en-IN')}`}
                desc="Recovered amount"
                icon={<FiTrendingUp />}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />

              <WeeklyStatCard
                label="Outstanding Debt"
                val={`₹${weeklyStats.totalPendingWeek.toLocaleString('en-IN')}`}
                desc="Pending principal"
                icon={<FiTrendingDown />}
                color="text-rose-600"
                bg="bg-rose-50"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const WeeklyStatCard = ({
  label,
  val,
  desc,
  icon,
  color,
  bg,
}) => (
  <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} ${bg} text-xl shrink-0`}
    >
      {icon}
    </div>

    <div>
      <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider">
        {label}
      </span>

      <h3 className={`text-lg sm:text-xl font-black ${color}`}>
        {val}
      </h3>

      <p className="text-[9px] font-bold text-slate-400">{desc}</p>
    </div>
  </div>
);

const TableEmptyState = () => (
  <tr>
    <td colSpan="5" className="p-20 text-center">
      <div className="text-4xl mb-4 opacity-30">📭</div>

      <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">
        No Transactions Found
      </h3>
    </td>
  </tr>
);

export default DailyCollectionReport;