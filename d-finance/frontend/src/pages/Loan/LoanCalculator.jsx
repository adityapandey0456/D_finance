import React, { useState, useEffect, useCallback } from 'react';
import { FiDollarSign, FiArrowRight, FiInfo } from 'react-icons/fi';

const LoanCalculator = () => {

  // ---------------- STATES ----------------
  const [p, setP] = useState(10000); // Loan Amount

  // 10% PER MONTH INTEREST
  const [r] = useState(10);

  const [months, setMonths] = useState(3);

  const [monthlyEmi, setMonthlyEmi] = useState(0);
  const [weeklyEmi, setWeeklyEmi] = useState(0);
  const [dailyEmi, setDailyEmi] = useState(0);

  const [totalWeeks, setTotalWeeks] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  // ---------------- CONFIG ----------------
  const PROCESSING_FEE_PERCENT = 2;

  // ---------------- EMI CALCULATION ----------------
  const calculateEMI = useCallback(() => {

    if (p > 0 && months > 0) {

      // ---------------- INTEREST ----------------
      // 10% PER MONTH
      const totalInterest = p * (r / 100) * months;

      // ---------------- TOTAL PAYABLE ----------------
      const totalPayable = Number(p) + totalInterest;

      // ---------------- ACTUAL CALENDAR ----------------
      const startDate = new Date();

      const endDate = new Date();

      endDate.setMonth(endDate.getMonth() + months);

      const diffTime = endDate - startDate;

      const diffDays = Math.ceil(
        diffTime / (1000 * 60 * 60 * 24)
      );

      // ---------------- TOTAL WEEKS ----------------
      const weeks = Math.ceil(diffDays / 7);

      // ---------------- EMI ----------------
      const daily = Math.round(totalPayable / diffDays);

      const weekly = Math.round(totalPayable / weeks);

      const monthly = Math.round(totalPayable / months);

      // ---------------- SET STATE ----------------
      setMonthlyEmi(monthly);

      setWeeklyEmi(weekly);

      setDailyEmi(daily);

      setTotalWeeks(weeks);

      setTotalDays(diffDays);

    } else {

      setMonthlyEmi(0);

      setWeeklyEmi(0);

      setDailyEmi(0);

      setTotalWeeks(0);

      setTotalDays(0);
    }

  }, [p, months, r]);

  useEffect(() => {
    calculateEMI();
  }, [calculateEMI]);

  // ---------------- EXTRA VALUES ----------------
  const processingFee = (p * PROCESSING_FEE_PERCENT) / 100;

  const netDisbursed = p - processingFee;

  const totalInterest = p * (r / 100) * months;

  const totalRepayment = p + totalInterest;

  // ---------------- UI ----------------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-2">

      {/* INPUT SECTION */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">

        <h3 className="font-black text-xl mb-8 text-slate-800 uppercase tracking-tighter flex items-center gap-2">
          <FiDollarSign className="text-indigo-600" />
          Loan Estimator
        </h3>

        <div className="space-y-8">

          {/* LOAN AMOUNT */}
          <div className="space-y-4">

            <div className="flex justify-between items-center">

              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Loan Amount
              </label>

              <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                ₹{Number(p).toLocaleString()}
              </span>
            </div>

            <input
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={p}
              onChange={(e) => setP(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* INTEREST */}
          <div className="space-y-4">

            <div className="flex justify-between items-center">

              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Interest Rate
              </label>

              <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                {r}% Per Month
              </span>
            </div>

            <div className="h-2 bg-emerald-100 rounded-full w-full relative">
              <div className="absolute h-full bg-emerald-500 rounded-full w-full"></div>
            </div>
          </div>

          {/* DURATION */}
          <div className="space-y-4">

            <div className="flex justify-between items-center">

              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Duration
              </label>

              <span className="font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                {months} Months
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="36"
              step="1"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>

        {/* PAYOUT */}
        <div className="mt-10 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">

          <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FiInfo />
            Payout Breakdown
          </h4>

          <div className="space-y-3">

            <div className="flex justify-between text-xs font-bold text-slate-500">

              <span>Requested Loan:</span>

              <span className="text-slate-700">
                ₹{Number(p).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between text-xs font-bold text-red-500">

              <span>Processing Fee ({PROCESSING_FEE_PERCENT}%):</span>

              <span>
                - ₹{Number(processingFee).toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-indigo-200 flex justify-between text-sm font-black text-indigo-700">

              <span>In-Hand Amount:</span>

              <span>
                ₹{Number(netDisbursed).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* OUTPUT SECTION */}
      <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 flex flex-col justify-between relative overflow-hidden">

        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>

        <div>

          <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
            Estimated EMI
          </p>

          <div className="space-y-6">

            {/* MONTHLY */}
            <div>
              <div className="flex items-baseline gap-2">

                <span className="text-5xl font-black tracking-tighter italic">
                  ₹{Number(monthlyEmi).toLocaleString()}
                </span>

                <span className="text-indigo-400 font-bold">
                  /month
                </span>
              </div>
            </div>

            {/* WEEKLY */}
            <div>
              <div className="flex items-baseline gap-2">

                <span className="text-3xl font-black tracking-tighter italic text-emerald-400">
                  ₹{Number(weeklyEmi).toLocaleString()}
                </span>

                <span className="text-emerald-300 font-bold">
                  /week
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                {totalWeeks} Weekly Installments
              </p>
            </div>

            {/* DAILY */}
            <div>
              <div className="flex items-baseline gap-2">

                <span className="text-2xl font-black tracking-tighter italic text-orange-400">
                  ₹{Number(dailyEmi).toLocaleString()}
                </span>

                <span className="text-orange-300 font-bold">
                  /day
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                {totalDays} Total Days
              </p>
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="mt-12 space-y-6">

          <div className="flex justify-between items-center border-b border-white/5 pb-4">

            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Principal Amount
            </span>

            <span className="font-black">
              ₹{Number(p).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-white/5 pb-4">

            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total Interest
            </span>

            <span className="font-black text-emerald-400">
              ₹{Number(totalInterest).toLocaleString()}
            </span>
          </div>

          <div className="pt-4 flex justify-between items-center">

            <span className="text-sm font-black uppercase tracking-widest text-indigo-200">
              Total Payable
            </span>

            <span className="text-2xl font-black text-white">
              ₹{Number(totalRepayment).toLocaleString()}
            </span>
          </div>
        </div>

        {/* BUTTON */}
        <button className="mt-10 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/40">

          Request Disbursement

          <FiArrowRight />
        </button>
      </div>
    </div>
  );
};

export default LoanCalculator;