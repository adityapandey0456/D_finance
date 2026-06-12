import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- NEW LANDING PAGE ---
import AboutUs from '../pages/AboutUs';
import ContactUs from '../pages/ContactUs';
import LandingPage from '../pages/LandingPage'; 

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import UserLayout from '../layouts/UserLayout'; 
import CustomerLayout from '../layouts/CustomerLayout'; 
import AccountantLayout from '../layouts/AccountantLayout';

// Auth Pages
import Login from '../pages/Auth/Login'; 
import Signup from '../pages/Auth/Signup';

// Admin Pages
import Dashboard from '../pages/Dashboard/AdminDashboard';
import BranchMaster from '../pages/Master/BranchMaster/BranchMaster';
import CustomerEntry from '../pages/Customer/CustomerEntry/CustomerEntry';
import LoanMaster from '../pages/Master/LoanMaster/LoanMaster';
import AdvisorEntry from '../pages/Advisor/AdvisorEntry/AdvisorEntry';
import CollectionEntry from '../pages/Collection/CollectionEntry';
import BulkDataRetrieval from '../pages/Admin/BulkDataRetrieval'; 
import ManageBlogs from '../pages/Admin/ManageBlogs'; 

// --- NAYE ADMIN PAGES (Fintech Core) ---
import AdminStatsDashboard from '../pages/Admin/AdminStatsDashboard';
import AdminApproval from '../pages/Admin/AdminApproval';
import AdvisorPerformance from '../pages/Admin/AdvisorPerformance';
import DailyCollectionReport from '../pages/Admin/DailyCollectionReport'; // Naya Page

// User (Advisor) Pages
import UserDashboard from '../pages/User/FieldOfficerDashboard';
import AdvisorVerification from '../pages/Advisor/AdvisorVerification'; 
import RegisterCustomer from '../pages/officer/RegisterCustomer';
import MyTeam from '../pages/User/MyTeam';
// Accountant Pages
import AccountantApproval from '../pages/Accountant/AccountantApproval'; 
import PaymentApproval from '../pages/Accountant/PaymentApproval';
import AccountantReports from '../pages/Accountant/AccountantReports';
import BulkDataTerminal from '../pages/Accountant/BulkDataTerminal';

// Customer Pages
import CustomerDashboard from "../pages/Customer/CustomerDashboard";
import LoanApply from "../pages/Loan/ApplyLoan";
import LoanTracking from "../pages/Customer/LoanTracking"; 
import EMIPayments from "../pages/Customer/EMIPayments";
import PaymentHistory from '../pages/Customer/PaymentHistory';
import BlogsPage from '../pages/BlogsPage';
import PaymentSuccess from '../pages/Payment/PaymentSuccess';
// ... Routes ke andar

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Website Home */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/blogs" element={<BlogsPage />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<ContactUs />} />

      {/* 3. Admin Routes (Mathura Branch Control) */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* Analytics & Core Management */}
        <Route index element={<AdminStatsDashboard />} /> 
        <Route path="/admin/analytics" element={<AdminStatsDashboard />} />
        <Route path="analytics" element={<AdminStatsDashboard />} />
        <Route path="approvals" element={<AdminApproval />} />
        <Route path="advisor-performance" element={<AdvisorPerformance />} />
        <Route path="daily-collection" element={<DailyCollectionReport />} />
        
        {/* Operation Routes */}
        <Route path="master/branch" element={<BranchMaster />} />
        <Route path="customer/entry" element={<CustomerEntry />} />
        <Route path="loan" element={<LoanMaster />} />
        <Route path="advisor" element={<AdvisorEntry />} />
        <Route path="collection" element={<CollectionEntry />} />
        <Route path="bulk-data-retrieval" element={<BulkDataRetrieval />} /> 
        <Route path="manage-blogs" element={<ManageBlogs />} />
      </Route>

      {/* 4. User (Advisor) Routes */}
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<UserDashboard />} />
        <Route path="field-verification" element={<AdvisorVerification />} /> 
        <Route path="payouts" element={<AdvisorPerformance />} /> {/* Advisor bhi apna payout dekh sake */}
        <Route path="register-customer" element={<RegisterCustomer />} />
        <Route path="my-team" element={<MyTeam />} />
      </Route>

      {/* 5. Accountant Routes */}
      <Route path="/accountant" element={<AccountantLayout />}> 
      <Route path="/accountant/bulk-data" element={<BulkDataTerminal />} />
      <Route path="/accountant/reports" element={<AccountantReports />} />
  {/* Yahan se slash hata do */}
  <Route path="approval" element={<AccountantApproval />} /> 
  <Route path="payment-approval" element={<PaymentApproval />} /> 
  
</Route>
     

      {/* 6. Customer Routes */}
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="apply-loan" element={<LoanApply />} />
        <Route path="tracking" element={<LoanTracking />} />
        <Route path="emi" element={<EMIPayments />} />
        <Route path="/customer/payment-history" element={<PaymentHistory />} />
      </Route>

<Route
  path="/payment-success"
  element={<PaymentSuccess />}
/>
      {/* 7. Error 404 */}
      <Route path="*" element={
        <div className="h-screen flex flex-col items-center justify-center font-bold text-2xl text-red-500 bg-gray-100">
          <h1 className="text-9xl animate-pulse">404</h1>
          <p className="text-slate-600">D-Finance: Invalid Access Path</p>
          <button 
            onClick={() => window.location.href='/login'} 
            className="mt-8 px-8 py-3 bg-blue-600 text-white text-sm rounded-2xl shadow-xl shadow-blue-500/30 hover:scale-105 transition-all"
          >
            Back to Secure Login
          </button>
        </div>
      } />
    </Routes>
  );
};

export default AppRoutes;