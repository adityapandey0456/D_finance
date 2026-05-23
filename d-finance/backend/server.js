console.log("🔥 THIS IS ACTIVE SERVER FILE");
require('dotenv').config(); 
const express = require('express');
const connectDB = require('./config/db'); 
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// server.js ke top par check karo aur ye add karo
const Loan = require('./models/Loan');
const Payment = require('./models/Payment'); // 🔥 IMPORTANT
const Blog = require('./models/Blog');
// const Cashfree = require("cashfree-pg");
// Models Import
const User = require('./models/User'); 
const axios = require("axios");
// const Loan = require('./models/Loan'); 

const app = express();

// --- 1. DATABASE & MIDDLEWARES ---
connectDB();
// --- server.js mein cors settings ---
// --- DATABASE & MIDDLEWARES KE BAAD ---

app.use(cors({
  origin: [
    "http://localhost:5173",                   // Local Testing ke liye
    // "https://d-finance-izsi.vercel.app",       // Aapka Frontend (Vercel)
    "https://dfinance.space",
    "https://www.dfinance.space"               // Aapka Custom Domain (agar hai)
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Ye hamesha CORS ke niche hona chahiye
// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- EXTRA SAFETY FOR RENDER (Preflight fix) ---
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Agar request allow list se hai toh header set karein
  if (origin && (origin.includes("localhost") || origin.includes("vercel.app") || origin.includes("onrender.com"))) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// --- 2. AUTH MIDDLEWARE ---
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: "Access Denied" });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) { res.status(401).json({ error: "Invalid Token" }); }
};

// --- 3. AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { mobile, password, role, fullName, email } = req.body;
        const userExists = await User.findOne({ mobile });
        if (userExists) return res.status(400).json({ error: "Mobile already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({ 
            fullName, mobile, email: email?.toLowerCase().trim(), 
            password: hashedPassword, role: role || 'Customer', isVerified: false 
        });

        await newUser.save();
        res.status(201).json({ success: true, message: "Registration successful" });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { mobile, password } = req.body;
        const user = await User.findOne({ mobile });
        if (!user) return res.status(401).json({ error: "Account not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid Credentials" });

        const token = jwt.sign({ id: user._id, role: user.role, fullName: user.fullName }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ success: true, token, user: { id: user._id, fullName: user.fullName, role: user.role } });
    } catch (err) { res.status(500).json({ error: "Login Server Error" }); }
});

// --- 4. LOAN SYSTEM (CUSTOMER & FILTERS) ---

app.post('/api/loans/pay-manual/:loanId', async (req, res) => {
  try {
    // 🚨 FIX 1: 'screenshot' ko req.body se nikalna zaroori hai
    const { utr, amount, customerId, screenshot, customerName } = req.body;
    const loanIdParam = req.params.loanId;

    // 🔍 DEBUG: VS Code terminal mein length check karo
    console.log("-----------------------------------------");
    console.log(`📩 New Payment Request for: ${loanIdParam}`);
    console.log(`📸 Image received: ${screenshot ? (screenshot.length / 1024).toFixed(2) + " KB" : "EMPTY (0)"}`);
    console.log("-----------------------------------------");

    // 1. Double check for Duplicate UTR
    if (utr && utr !== "CASHFREE_PAY") {
        const existingPayment = await Payment.findOne({ utr: utr.trim() });
        if (existingPayment) {
          return res.status(400).json({ error: "Ye UTR pehle hi use ho chuka hai!" });
        }
    }

    // 2. Loan check
    const loan = await Loan.findOne({ loanId: loanIdParam });
    if (!loan) return res.status(404).json({ error: "Loan Record Not Found" });

    // 3. Create NEW Unique Payment Record
    const newPayment = new Payment({
      paymentId: "PAY-" + Date.now() + Math.floor(Math.random() * 1000),
      loanId: loanIdParam,
      customerId: loan.customerId || customerId,
      customerName: loan.customerName || customerName,
      amount: Number(amount),
      utr: utr ? utr.trim() : "N/A",
      screenshot: screenshot || "", // 🔥 Ab ye successfully save hoga
      status: 'Pending'
    });

    await newPayment.save();

    // 4. Update internal Loan History
    await Loan.findOneAndUpdate(
      { loanId: loanIdParam },
      { 
        $push: { 
          repaymentHistory: { 
            amount: Number(amount), 
            utr: utr ? utr.trim() : "N/A", 
            status: 'Pending',
            date: new Date() 
          } 
        } 
      }
    );

    res.status(200).json({ success: true, message: "Payment logged with screenshot!" });
  } catch (err) {
    console.error("❌ Save Error:", err.message);
    res.status(500).json({ error: "Server Error: " + err.message });
  }
});
app.post('/api/loans', verifyToken, async (req, res) => {
  try {
    const loanData = req.body;
    // Initial Status setting for Pool visibility
    const newLoan = new Loan({
        ...loanData,
        customerId: req.user.id,
        totalPending: loanData.totalPayable || 0,
        status: 'Hold - Pending Assignment', // Standard New Lead status
        isAssigned: false
    });
    await newLoan.save();
    res.status(201).json({ success: true, loan: newLoan });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/loans', verifyToken, async (req, res) => {
    try {
        const { status, sponsorId } = req.query;
        let query = {};
        if (sponsorId) query.fieldOfficerId = sponsorId;

        // Flexible Status Handling
        if (status) {
            if (status === "Verification Pending") {
                query.status = { $in: ["Verification Pending", "Pending Verification"] };
            } else {
                query.status = status;
            }
        }

        if (!status && !sponsorId) query.customerId = req.user.id;

        const loans = await Loan.find(query).sort({ createdAt: -1 });
        res.json(loans);
    } catch (err) { res.status(500).json({ error: "Fetch error" }); }
});

// --- 5. FIELD OFFICER / ADVISOR ROUTES ---

// Pool: Advisor picks new leads
app.get('/api/officer/available-requests', verifyToken, async (req, res) => {
    try {
        const userRole = req.user.role ? req.user.role.toLowerCase() : "";
        if (userRole !== 'user' && userRole !== 'admin') {
            return res.status(403).json({ error: "Access Denied" });
        }

        // Fix: Shows both 'Applied' and 'Hold' leads
        const unassigned = await Loan.find({ 
            isAssigned: false, 
            status: { $in: ['Applied', 'Hold - Pending Assignment'] } 
        }).sort({ createdAt: -1 });
        
        res.json(unassigned);
    } catch (err) { res.status(500).json({ error: "Pool Fetch Error" }); }
});

// Accept Lead
// Accept Lead Fix: Support for both MongoDB _id and custom loanId
app.post('/api/officer/accept-loan/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 🚀 Check: Agar ID 'LN-' se start ho rahi hai toh custom find karein, warna findById
        const query = id.startsWith('LN-') ? { loanId: id } : { _id: id };

        const loan = await Loan.findOneAndUpdate(
            query, 
            {
                fieldOfficerId: req.user.id,
                isAssigned: true,
                status: 'Pending Verification'
            }, 
            { new: true }
        );

        if (!loan) {
            return res.status(404).json({ error: "Loan not found in database" });
        }

        console.log(`✅ Loan ${id} accepted by ${req.user.fullName}`);
        res.json({ success: true, loan });
    } catch (err) { 
        console.error("❌ Accept Error Details:", err.message);
        res.status(500).json({ error: "Accept Error", details: err.message }); 
    }
});
// Submit Audit (PATCH)
app.patch('/api/loans/:id', verifyToken, async (req, res) => {
    try {
        const updatedLoan = await Loan.findByIdAndUpdate(
            req.params.id, 
            { $set: { ...req.body, status: 'Field Verified' } }, 
            { new: true }
        );
        res.json({ success: true, loan: updatedLoan });
    } catch (err) { res.status(500).json({ error: "Audit Submit Error" }); }
});

// --- 6. ACCOUNTANT & ADMIN DASHBOARD ---

// ==========================================
// 🛠️ FIXES FOR ADMIN ANALYTICS & MANAGEMENT
// ==========================================

// 1. DASHBOARD STATS (For Graphs)
app.get('/api/admin/stats', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: "Admin Only" });
        
        const loans = await Loan.find({});
        const customerCount = await User.countDocuments({ role: 'Customer' });
        
        // Total Disbursed Calculation
        const totalDisbursed = loans
            .filter(l => l.status === 'Disbursed')
            .reduce((sum, l) => sum + (l.amount || 0), 0);
            
        // Total Recovery Calculation (Approved Payments)
        let totalRecovered = 0;
        loans.forEach(loan => {
            loan.repaymentHistory?.forEach(pay => {
                if (pay.status === 'Approved') totalRecovered += (pay.amount || 0);
            });
        });

        res.json({ totalDisbursed, totalRecovered, customerCount });
    } catch (err) { res.status(500).json({ error: "Stats sync error" }); }
});

// 2. SEPARATE CUSTOMER LIST
app.get('/api/admin/all-customers', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: "Admin Only" });
        const customers = await User.find({ role: 'Customer' }).select('-password').sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) { res.status(500).json({ error: "Customers fetch error" }); }
});

// 3. ALL STAFF LIST (Admins, Accountants, Advisors)
app.get('/api/admin/all-staff', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: "Admin Only" });
        const staff = await User.find({ role: { $ne: 'Customer' } }).select('-password').sort({ role: 1 });
        res.json(staff);
    } catch (err) { res.status(500).json({ error: "Staff fetch error" }); }
});

// 4. UTR PAYMENT APPROVAL (Very Important)
app.post('/api/admin/approve-payment', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'Accountant') return res.status(403).json({ error: "Unauthorized" });
        
        const { loanId, paymentId } = req.body;
        const loan = await Loan.findOne({ loanId: loanId });
        
        if (!loan) return res.status(404).json({ error: "Loan record not found" });

        // Payment status ko update karna
        const payment = loan.repaymentHistory.id(paymentId);
        if (payment) {
            payment.status = 'Approved';
            // Total Pending Amount kam karna
            loan.totalPending = Math.max(0, (loan.totalPending || 0) - payment.amount);
            await loan.save();
            res.json({ success: true, message: "Payment Verified & Approved!" });
        } else {
            res.status(404).json({ error: "Payment ID not found" });
        }
    } catch (err) { res.status(500).json({ error: "Approval failed: " + err.message }); }
});

// 5. DAILY COLLECTION REPORT
app.get('/api/admin/collection-report', verifyToken, async (req, res) => {
    try {
        const today = new Date().setHours(0, 0, 0, 0);
        const loans = await Loan.find({ "repaymentHistory.status": "Approved" });
        
        let report = [];
        loans.forEach(loan => {
            loan.repaymentHistory.forEach(pay => {
                const payDate = new Date(pay.date).setHours(0, 0, 0, 0);
                if (payDate === today && pay.status === 'Approved') {
                    report.push({
                        _id: pay._id,
                        loanId: loan.loanId,
                        customerName: loan.customerName,
                        amount: pay.amount,
                        utr: pay.utr,
                        paymentDate: pay.date,
                        method: "UPI / QR"
                    });
                }
            });
        });
        res.json(report);
    } catch (err) { res.status(500).json({ error: "Report failed" }); }
});

// 6. DELETE USER ROUTE
app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: "Admin Only" });
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "User deleted" });
    } catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

// ==========================================
// 🛠️ ADMIN MASTER CONTROL ROUTES (FIXED)
// ==========================================

// 1. Dashboard Stats (Graphs aur Cards ke liye)
app.get('/api/admin/stats', verifyToken, async (req, res) => {
    try {
        const loans = await Loan.find({});
        const customerCount = await User.countDocuments({ role: { $in: ['Customer', 'customer'] } });
        
        // Total Disbursed (Sirf wahi jo Disbursed ho chuke hain)
        const totalDisbursed = loans
            .filter(l => l.status === 'Disbursed')
            .reduce((sum, l) => sum + (l.amount || 0), 0);
            
        // Total Recovery (Sirf 'Approved' payments ka sum)
        let totalRecovered = 0;
        loans.forEach(loan => {
            loan.repaymentHistory?.forEach(pay => {
                if (pay.status === 'Approved') totalRecovered += (pay.amount || 0);
            });
        });

        res.json({ totalDisbursed, totalRecovered, customerCount });
    } catch (err) { res.status(500).json({ error: "Stats error" }); }
});

// 2. All Customers List (Sirf customers dikhane ke liye)
app.get('/api/admin/all-customers', verifyToken, async (req, res) => {
    try {
        // Case-insensitive check for 'Customer'
        const customers = await User.find({ 
            role: { $regex: /customer/i } 
        }).select('-password').sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) { res.status(500).json({ error: "Customer fetch error" }); }
});

// 3. All Staff List (Admin, Accountant, Advisors)
app.get('/api/admin/all-staff', verifyToken, async (req, res) => {
    try {
        const staff = await User.find({ 
            role: { $not: { $regex: /customer/i } } 
        }).select('-password').sort({ role: 1 });
        res.json(staff);
    } catch (err) { res.status(500).json({ error: "Staff fetch error" }); }
});

// 4. Daily Collection Report (Aaj ki approved recovery)
app.get('/api/admin/collection-report', verifyToken, async (req, res) => {
    try {
        const today = new Date().setHours(0, 0, 0, 0);
        const loans = await Loan.find({ "repaymentHistory.status": "Approved" });
        
        let report = [];
        loans.forEach(loan => {
            loan.repaymentHistory.forEach(pay => {
                const payDate = new Date(pay.date).setHours(0, 0, 0, 0);
                if (payDate === today && pay.status === 'Approved') {
                    report.push({
                        _id: pay._id,
                        loanId: loan.loanId,
                        customerName: loan.customerName,
                        amount: pay.amount,
                        utr: pay.utr,
                        date: pay.date,
                        method: "UPI / QR"
                    });
                }
            });
        });
        res.json(report);
    } catch (err) { res.status(500).json({ error: "Report failed" }); }
});

// 5. UTR Payment Approval Logic (Most Important)
app.post('/api/admin/approve-payment', verifyToken, async (req, res) => {
    try {
        const { loanId, paymentId } = req.body;
        // Loan dhundo chahe ID LN- se ho ya MongoDB ID ho
        const loan = await Loan.findOne({ loanId: loanId });
        
        if (!loan) return res.status(404).json({ error: "Loan not found" });

        const payment = loan.repaymentHistory.id(paymentId);
        if (payment) {
            payment.status = 'Approved';
            // Total balance kam karna
            loan.totalPending = Math.max(0, (loan.totalPending || 0) - payment.amount);
            await loan.save();
            res.json({ success: true, message: "Payment Approved!" });
        } else {
            res.status(404).json({ error: "Payment record missing" });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Bulk Delete User
app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Delete failed" }); }
});
// Add this in server.js under Admin Master Control section
app.get('/api/admin/all-loans', verifyToken, async (req, res) => {
    try {
        const loans = await Loan.find({}).sort({ createdAt: -1 });
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: "Fetch error" });
    }
});
// adminroutes.js ya server.js mein
app.post('/api/admin/change-password', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: "Admin Only" });

        const { userId, newPassword } = req.body;

        // Password hash karna zaroori hai (bcrypt use karein)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        res.json({ success: true, message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Password update failed" });
    }
});
// Sabhi users (Admin, Staff, Customer) ko fetch karne ke liye
app.get('/api/admin/all-users-absolute', verifyToken, async (req, res) => {
    try {
        // .find({}) ka matlab hai bina kisi filter ke sare users
        const users = await User.find({}).select('-password').sort({ role: 1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Master fetch error" });
    }
});
// backend/server.js mein ye add karo agar nahi hai
app.get('/api/user/my-dashboard', verifyToken, async (req, res) => {
    try {
        const officerId = req.user.id;
        
        // Leads jo abhi tak kisi ne nahi li
        const unassigned = await Loan.countDocuments({ 
            isAssigned: false, 
            status: { $in: ['Applied', 'Hold - Pending Assignment'] } 
        });

        // Leads jo is advisor (logged-in user) ke paas pending hain
        const pending = await Loan.countDocuments({ 
            fieldOfficerId: officerId, 
            status: { $in: ['Pending Verification', 'Verification Pending'] } 
        });

        res.json({ success: true, stats: { pending, unassigned } });
    } catch (err) {
        res.status(500).json({ error: "Dashboard stats failed" });
    }
});
// --- Accountant Approval Route ---
// Ise apne baaki routes ke saath add karein
app.post('/api/accountant/approve/:id', async (req, res) => {
  try {
    const loanId = req.params.id;

    // 1. Loan ko find karo aur status update karo
    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      { 
        status: 'Disbursed', // Accountant ne approve kar diya
        disbursedAt: new Date(),
        // Agar aap chahte hain ki repayment yahan se shuru ho
        nextEmiDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Kal ki date recovery ke liye
      },
      { new: true }
    );

    if (!updatedLoan) {
      return res.status(404).json({ success: false, error: "Loan record not found" });
    }

    console.log(`💰 Funds Disbursed for Loan: ${updatedLoan.loanId}`);
    
    res.status(200).json({ 
      success: true, 
      message: "Payment released successfully", 
      loan: updatedLoan 
    });

  } catch (err) {
    console.error("Disbursement Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
// Example Payment Route (Backend)

app.get('/api/payments', async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId required"
      });
    }

    const payments = await Payment.find({ customerId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments
    });

  } catch (err) {
    console.error("Fetch Error:", err);

    res.status(500).json({
      success: false,
      payments: []
    });
  }
});
// 🔥 PERMANENT DELETE ROUTE
app.delete('/loans/:id', async (req, res) => {
  try {
    const loanId = req.params.id;

    // Database se record delete karo
    const deletedLoan = await Loan.findByIdAndDelete(loanId);

    if (!deletedLoan) {
      return res.status(404).json({ 
        success: false, 
        error: "Loan record not found in database" 
      });
    }

    console.log(`🗑️ Loan Deleted: ${loanId}`);

    res.status(200).json({ 
      success: true, 
      message: "Application permanently deleted from ledger" 
    });
    
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error during deletion" 
    });
  }
});

app.post('/api/accountant/approve-payment/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status === 'Approved') return res.status(400).json({ error: "Already approved" });

    // 1. Payment Status Update
    payment.status = 'Approved';
    await payment.save();

    // 2. 🔥 LOAN BALANCE UPDATE (Sabse Zaroori Step)
    await Loan.findOneAndUpdate(
      { loanId: payment.loanId },
      { 
        $inc: { 
          totalPaid: payment.amount,      // totalPaid badhao
          totalPending: -payment.amount   // totalPending kam karo
        } 
      }
    );

    res.json({ success: true, message: "Payment Approved and Loan Balance Updated!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 1. Pending Payments Fetch karne ka Route
app.get('/api/admin/pending-payments', async (req, res) => {
  try {
    // Sirf wahi payments uthao jinka status 'Pending' hai
    const pending = await Payment.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments: " + err.message });
  }
});

// 2. Payment Approve karne ka Route
app.post('/api/admin/approve-payment/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // A. Payment record dhundo
    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    // B. Status badlo
    payment.status = 'Approved';
    payment.verifiedAt = new Date();
    await payment.save();

    // C. 🔥 Sabse Main: Loan collection mein balance update karo
    // totalPaid badhao aur totalPending kam karo
    await Loan.findOneAndUpdate(
      { loanId: payment.loanId },
      { 
        $inc: { 
          totalPaid: payment.amount, 
          totalPending: -payment.amount 
        } 
      }
    );

    res.status(200).json({ success: true, message: "Approved & Balance Updated!" });
  } catch (err) {
    res.status(500).json({ error: "Approval failed: " + err.message });
  }
});
// Blogs fetch karne ka backend route
app.get('/api/admin/all-blogs', async (req, res) => {
  try {
    // Agar aapne Blog model banaya hai toh:
    // const blogs = await Blog.find().sort({ createdAt: -1 });
    // res.json(blogs);
    
    // Abhi ke liye empty array bhej do taaki error na aaye
    res.json([]); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Blogs ke liye Backend Routes
// Note: Ensure karo aapne Blog Model banaya hai, nahi toh niche wala simple logic use karo

// 1. Fetch all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ date: -1 }); // Database se fetch karo
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});
// 2. Create new blog
app.post('/api/blogs', async (req, res) => {
  try {
    const newBlog = new Blog(req.body);
    await newBlog.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update blog
app.put('/api/blogs/:id', async (req, res) => {
  try {
    // const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Updated!" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 4. Delete blog
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    // await Blog.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted!" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// server.js mein ye route dalo
app.get('/api/loans/my-payments', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.id; // Token se ID nikali
        // Payment model mein customerId matches check kiya
        const history = await Payment.find({ customerId }).sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

// 3. Fix: Accountant Add Karne Ka Logic (Signup Route Update)
// Note: Aapka existing signup route hi kaam karega, bas dropdown mein 'Accountant' role bhejiye.

app.post('/api/create-order', async (req, res) => {

  try {

    console.log("🔥 CREATE ORDER API HIT");
    console.log(req.body);

    const {
      loanId,
      amount,
      customerName,
      customerPhone
    } = req.body;

    // 🔥 REAL LOAN ID USE KARO
    const orderData = {

  order_amount: amount,

  order_currency: "INR",

order_id: loan._id.toString(),
customer_id: loan.customerId.toString(),

  customer_details: {
    customer_id: loanId,
    customer_name: customerName,
    customer_phone: customerPhone
  }
    };

    const response = await axios.post(

      "https://api.cashfree.com/pg/orders",
      orderData,

      {
        headers: {

          "x-client-id": process.env.CASHFREE_APP_ID,

          "x-client-secret": process.env.CASHFREE_SECRET_KEY,

          "x-api-version": "2022-09-01",

          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ CASHFREE RESPONSE:");
    console.log(response.data);

    return res.status(200).json(response.data);

  } catch (err) {

    console.log("❌ CASHFREE ERROR:");

    if (err.response) {
      console.log(err.response.data);

      return res.status(500).json(err.response.data);
    }

    console.log(err.message);

    return res.status(500).json({
      error: err.message
    });
  }
});

app.all('/api/cashfree/webhook', async (req, res) => {

  try {
    const data = req.body.data;

    console.log("🔥 CASHFREE WEBHOOK HIT");

    console.log("METHOD:", req.method);

    console.log("BODY:", JSON.stringify(req.body, null, 2));

    if (req.method === "GET") {

      return res.status(200).json({
        success: true,
        message: "Webhook Active"
      });
    }

    // 🔥 FIXED
    const paymentData = req.body?.data?.payment;

    const orderData = req.body?.data?.order;

    if (!paymentData || !orderData) {

      console.log("⚠️ Invalid payload");

      return res.status(200).json({
        success: true
      });
    }

    console.log("💰 PAYMENT STATUS:", paymentData.payment_status);

    if (paymentData.payment_status === "SUCCESS") {

      // 🔥 FIXED
      const orderId = orderData.order_id;
      console.log("ORDER ID:", orderId);
      console.log("CUSTOMER ID:", req.body?.data?.customer_details?.customer_id);

      const amount = Number(paymentData.payment_amount || 0);

      console.log("✅ SUCCESS PAYMENT FOR:", orderId);

      // DUPLICATE CHECK
      const existingPayment = await Payment.findOne({
        paymentId: String(paymentData.cf_payment_id)
      });

      if (existingPayment) {

        console.log("⚠️ Duplicate payment ignored");

        return res.status(200).json({
          success: true
        });
      }

      // FIND LOAN
      const customerId =
  req.body?.data?.customer_details?.customer_id;

const loan = await Loan.findOne({
  cashfreeOrderId: orderId
});

      if (!loan) {

        console.log("❌ Loan not found");

        return res.status(404).json({
          error: "Loan not found"
        });
      }

      console.log("✅ Loan Found:", loan.loanId);

      // SAVE PAYMENT
      const newPayment = new Payment({

        paymentId: String(paymentData.cf_payment_id),

        loanId: loan.loanId,

        customerId: loan.customerId,

        customerName: loan.customerName,

        amount: amount,

        status: "Approved",

        utr:
          paymentData.bank_reference || "CASHFREE",

        paymentMethod: "ONLINE",

        customerPhone:
          req.body?.data?.customer_details?.customer_phone || "",

        verifiedAt: new Date()
      });

      await newPayment.save();

      console.log("✅ Payment Saved");

      // UPDATE LOAN
      const updatedLoan = await Loan.findOneAndUpdate(

        { loanId: loan.loanId },

        {
          $inc: {
            totalPaid: amount,
            totalPending: -amount
          }
        },

         { returnDocument: "after" }

      );

      console.log("✅ Loan Updated");

      // AUTO CLOSE
      if (
        updatedLoan &&
        updatedLoan.totalPending <= 0
      ) {

        updatedLoan.status = "Paid";

        await updatedLoan.save();

        console.log("🎉 Loan Fully Paid");
      }

      console.log("✅ PAYMENT AUTO APPROVED");
    }

    return res.status(200).json({
      success: true
    });

  } catch (err) {

    console.log("❌ WEBHOOK ERROR:");

    console.log(err);

    return res.status(500).json({
      error: err.message
    });
  }
});
// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 D-Finance Engine Running on Port ${PORT}`));