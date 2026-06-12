import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';
import { FiDownload, FiDatabase, FiFileText, FiAlertCircle, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

const BulkDataRetrieval = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 🚀 Fetch Logic optimized with useCallback
  const fetchBulkData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      
      const res = await API.get('/admin/all-loans'); 
      const data = Array.isArray(res.data) ? res.data : [];
      setLoans(data);
    } catch (err) {
      console.error("Bulk Retrieval Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBulkData();
  }, [fetchBulkData]);

  // 📥 ADVANCED MASTER CSV EXPORT ENGINE (Excel Optimized)
  const downloadCSV = () => {
    if (loans.length === 0) return alert("No records found to export.");

    // Extended headers matrix to support full structural KYC profile details
    const headers = [
      "LOAN_ID", 
      "CUSTOMER_NAME", 
      "MOBILE", 
      "EMAIL", 
      "NOMINEE_NAME", 
      "AADHAAR_STATUS", 
      "PAN_NUMBER", 
      "BANK_NAME", 
      "ACCOUNT_NUMBER", 
      "IFSC_CODE", 
      "SANCTIONED_AMOUNT", 
      "TOTAL_PAID",
      "TOTAL_PENDING",
      "LOAN_STATUS", 
      "HOUSE_TYPE", 
      "OCCUPATION", 
      "ASSIGNED_OFFICER", 
      "DISBURSEMENT_DATE"
    ];
    
    const rows = loans.map(l => {
      // Core profile resolution map fields
      const coreProfile = l.customerId || {};
      const baseAadhaar = coreProfile.aadhaar || l.aadhaar;
      
      // Zero-disclosure strict masking helper for Aadhaar numbers inside file generation strings
      const maskedAadhaar = baseAadhaar && baseAadhaar !== "N/A"
        ? `XXXX-XXXX-${String(baseAadhaar).replace(/\s+/g, '').slice(-4)}`
        : "N/A";

      return [
        `"${l.loanId || l._id}"`,
        `"${l.customerName || coreProfile.fullName || 'N/A'}"`,
        `"${l.customerMobile || coreProfile.mobile || '---'}"`,
        `"${coreProfile.email || '---'}"`,
        `"${l.nomineeName || coreProfile.nomineeName || '---'}"`,
        `"${maskedAadhaar}"`,
        `"${coreProfile.pan || '---'}"`,
        `"${coreProfile.bankName || l.bankDetails?.bankName || '---'}"`,
        `"${coreProfile.accountNumber || l.bankDetails?.accountNumber || '---'}"`,
        `"${coreProfile.ifsc || l.bankDetails?.ifsc || '---'}"`,
        l.amount || 0,
        l.totalPaid || 0,
        l.totalPending || 0,
        `"${l.status}"`,
        `"${l.houseType || 'N/A'}"`,
        `"${l.occupationSubCategory || 'N/A'}"`,
        `"${l.fieldOfficerName || l.verifiedByName || 'System'}"`,
        `"${new Date(l.createdAt).toLocaleDateString('en-IN')}"`
      ];
    });

    // Added \uFEFF BOM for absolute UTF-8 interpretation support in MS Excel sheets
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `D-Finance_Master_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn space-y-6">
      
      {/* --- Header & Export Action --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
            <FiDatabase className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">D-Finance Master Audit Station</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SOP Point 3: Complete KYC Registry & Financial Verification Logs</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={fetchBulkData} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={downloadCSV}
            disabled={loading || loans.length === 0}
            className="flex-grow md:flex-grow-0 flex items-center justify-center gap-3 bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 disabled:bg-slate-200"
          >
            <FiDownload className="text-lg" /> Export Master CSV
          </button>
        </div>
      </div>

      {/* --- Main Audit Table --- */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="p-6">Loan Identity</th>
                <th className="p-6">Portfolio & KYC Verification</th>
                <th className="p-6">Field Intelligence</th>
                <th className="p-6">Compliance Status</th>
                <th className="p-6 text-right">LUC Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="p-32 text-center font-bold text-slate-300 animate-pulse text-[10px] uppercase tracking-[0.3em]">Accessing Master Digital Ledger...</td></tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <FiAlertCircle className="mx-auto text-3xl text-red-400 mb-2" />
                    <p className="text-red-400 font-black uppercase text-[10px]">Data Fetch Failed (404/500)</p>
                    <button onClick={fetchBulkData} className="mt-2 text-blue-600 font-bold text-[9px] uppercase underline">Try Again</button>
                  </td>
                </tr>
              ) : loans.length > 0 ? (
                loans.map(loan => {
                  const hasBankLink = loan.customerId?.bankName || loan.bankDetails?.bankName;
                  const hasPanLink = loan.customerId?.pan;

                  return (
                    <tr key={loan._id || loan.loanId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <div className="font-black text-slate-900 text-sm tracking-tighter">{loan.loanId || 'NEW-LEAD'}</div>
                        <div className="text-[9px] text-slate-400 font-bold">{new Date(loan.createdAt).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm font-black text-slate-700 uppercase">{loan.customerName}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-blue-600 font-black tracking-tighter">₹{loan.amount?.toLocaleString('en-IN')}</span>
                          
                          {/* 🔥 Dynamic Verification Badge Indicators */}
                          {hasBankLink && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <FiCheckCircle size={9} /> Bank Verified
                            </span>
                          )}
                          {hasPanLink && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                              PAN Linked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        {loan.houseType ? (
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-slate-600 uppercase">🏠 {loan.houseType}</div>
                            <div className="text-[9px] font-bold text-slate-400">💼 {loan.occupationSubCategory || 'N/A'}</div>
                          </div>
                        ) : <span className="text-[9px] font-black text-amber-500 uppercase italic bg-amber-50 px-2 py-1 rounded-md">Visit Required</span>}
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          loan.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                         <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1.5 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                            {loan.fieldOfficerName || loan.verifiedByName || 'System Auto'}
                         </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-24 text-center">
                    <FiFileText className="mx-auto text-5xl text-slate-100 mb-4" />
                    <p className="text-slate-400 font-black uppercase italic text-xs tracking-widest">No matching audit records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center pb-10">
        <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">
          End of Master Audit Report • Mathura Branch Core Database Ledger
        </p>
      </div>
    </div>
  );
};

export default BulkDataRetrieval;