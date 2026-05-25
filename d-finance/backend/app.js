const express = require('express');
const cors = require('cors');
const path = require('path'); 
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const loanRoutes = require('./routes/loanRoutes');

const app = express();

// 1. CORS Middleware Activation
app.use(cors());

// 2. Body Parser With Secure Webhook rawBody Injection Buffer Matrix
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/cashfree/webhook') || req.originalUrl.includes('/webhook')) {
      req.rawBody = buf.toString(); 
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

// 🔌 Local Console Request Logger for Tracking Connections
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] Hit Received at -> ${req.url}`);
  next();
});

// 3. CORE API ROUTING INDEX (Top priority routes execution)
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/loans', loanRoutes); // Fixed base connection path map

// 4. SPA Catch-All File Isolation Strategy for Production
if (process.env.NODE_ENV === 'production') {
  console.log("📦 VPS Production Environment Active: Serving client distribution bundle.");
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  // Local environment status validation hook
  app.get('/', (req, res) => {
    res.json({ message: "🚀 D-Finance local API server node is active and running on port 5000!" });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 D-Finance Core API Mainframe running on port ${PORT}`));