const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  // --- 🆔 Identification ---
  loanId: { 
    type: String, 
    unique: true, 
    required: [true, "Loan ID is required"] 
  },
  paymentOrderId: {
    type: String
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, "Customer ID is required"] 
  },
  customerName: { 
    type: String, 
    required: [true, "Customer Name is required"] 
  },
  customerMobile: { // 🆕 Added to fix "Not Provided" on Accountant side
    type: String 
  },
  
  // --- 🧑‍💼 Field Officer & Advisor Logic ---
  fieldOfficerId: { 
    type: mongoose.Schema.Types.Mixed, 
    default: null 
  },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fieldOfficerName: { type: String },
  verifiedByName: { type: String }, 
  isAssigned: { 
    type: Boolean, 
    default: false 
  },

  // --- 💰 Amount Details ---
  amount: { type: Number, required: [true, "Amount is required"] }, 
  processingFee: { type: Number, default: 0 },
  fileCharge: { type: Number, default: 0 },
  netDisbursed: { type: Number }, 
  
  // --- 📈 Tenure & EMI Math ---
  tenureMonths: { type: Number, required: [true, "Tenure is required"] }, 
  totalWeeks: { type: Number }, 
  totalDays: { type: Number },
  emiType: { type: String }, 
  installmentAmount: { type: Number },
  totalInstallments: { type: Number },
  weeklyEMI: { type: Number }, 
  dailyEMI: { type: Number },  
  totalPayable: { type: Number, required: [true, "Total Payable amount is required"] }, 
  
  // --- 🏦 BANK DETAILS ---
  accountHolderName: { type: String },
  bankName: { type: String },
  branchName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  lastTransactionDate: { type: String },

  // --- 📸 CUSTOMER KYC DOCUMENTS (Officer Captured) ---
  custLivePhoto: { type: String }, // 🆕 Customer Live Photo
  custAadhaarFront: { type: String },
  custAadhaarBack: { type: String },
  custVoterFront: { type: String },
  custVoterBack: { type: String },
  custPAN: { type: String },
  custSignature: { type: String },
  secondaryIdFront: { type: String }, // 🆕 For Secondary ID verification
  secondaryIdBack: { type: String },  // 🆕 Fixed "Missing" on Accountant side
  passbookPic: { type: String },

  // --- 👤 NOMINEE DETAILS ---
  nomineeName: { type: String },
  nomineeRelation: { type: String },
  nomineeDOB: { type: String },
  nomineeAge: { type: String },
  nomineeMobile: { type: String },
  nomineeAddress: { type: String },
  nomineeGender: { type: String },
  nomineeCategory: { type: String },
  nomineePic: { type: String },

  // --- 🏠 FIELD AUDIT & HOUSEHOLD DETAILS ---
  religion: { type: String, default: 'HINDU' },
  category: { type: String, default: 'GENERAL' },
  houseType: { type: String }, // CONCRETE, KUTCHA, etc.
  areaType: { type: String },  // RURAL, URBAN, etc.
  residenceNature: { type: String }, // Owned, Rented
  yearsAtCurrentAddress: { type: String },
  totalFamilyMembers: { type: String },
  earningMembers: { type: String },
  
  // --- 💼 OCCUPATION & ECONOMY ---
  memberOccupation: { type: String },
  subOccupation: { type: String },
  incomeActivity: { type: String },
  familyIncomeActivities: { type: String },
  monthlyIncome: { type: String },
  familyExpenditure: { type: String },
  anyExistingLoan: { type: String }, 
  financialInclusion: { type: [String], default: [] }, 

  // --- 📍 SYSTEM & LOCATION ---
  locationName: { type: String }, 
  inspectionDate: { type: Date },
  
  // 🔥 NEW: Secure Live Geotagging Storage
  coordinates: {
    lat: { type: String, default: "" },
    lng: { type: String, default: "" }
  },

  // --- 📂 Categorization ---
  type: { 
    type: String, 
    enum: ['Personal Loan', 'JLG Loan', 'Agriculture Loan', 'Business Loan', 'Daily EMI', 'Weekly EMI'],
    default: 'JLG Loan'
  },
  
  emiFrequency: { 
    type: String, 
    enum: ['Daily', 'Weekly', 'Monthly'], 
    default: 'Daily' 
  },

  // --- 🚦 Status Workflow ---
  status: { 
    type: String, 
    enum: [
      'Pending', 'Applied', 'Hold - Pending Assignment', 
      'Pending Verification', 'Verification Pending', 
      'Field Verified', 'Approved', 'Disbursed', 'Rejected', 'Closed'
    ], 
    default: 'Verification Pending' 
  },

  // --- 💳 Repayment Tracking ---
  totalPaid: { type: Number, default: 0 },
  paidInstallments: { type: Number, default: 0 }, 
  totalPending: { type: Number }, 
  nextEmiDate: Date,
  
  repaymentHistory: [
    {
      amount: Number,
      date: { type: Date, default: Date.now },
      utr: { type: String, trim: true },
      status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
      }
    }
  ],

  appliedDate: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

module.exports = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);