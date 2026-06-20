const express = require('express');
const router = express.Router();
const multer = require('multer');

// Multer Setup (Filhal memory mein store kar rahe hain, aap ise disk ya cloud/S3 par bhi set kar sakte hain)
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

// Ye wo saare image fields hain jo hum frontend se bhej rahe hain
const imageUploads = upload.fields([
  { name: 'custLivePhoto', maxCount: 1 },
  { name: 'custAadhaarFront', maxCount: 1 },
  { name: 'custAadhaarBack', maxCount: 1 },
  { name: 'custVoterFront', maxCount: 1 },
  { name: 'passbookPic', maxCount: 1 },
  { name: 'nomineePic', maxCount: 1 },
  { name: 'custSignature', maxCount: 1 }
]);

// POST Route: /api/customer/add
router.post('/add', imageUploads, async (req, res) => {
  try {
    // 1. Text Data (Ye req.body mein aayega)
    const { fullName, mobile, entryMode, password, ...otherDetails } = req.body;

    // 2. Images Data (Ye req.files mein aayega)
    const files = req.files;

    console.log(`Receiving data for: ${fullName} (Mode: ${entryMode})`);
    
    if (files) {
      console.log("Images received:", Object.keys(files));
    }

    // 3. Database Save Logic (MongoDB / Mongoose)
    // Yahan aap apne Mongoose model ka use karke data MongoDB mein save karenge.
    /*
      const newCustomer = new Customer({
        fullName,
        mobile,
        password, // Ensure password is hashed using bcrypt before saving!
        ...otherDetails
        // Images ke buffer ya URL ko yahan map karein
      });
      await newCustomer.save();
    */

    // 4. Success Response
    res.status(200).json({ 
      message: `Customer ${fullName} successfully added!`,
      status: "success"
    });

  } catch (error) {
    console.error("Backend Error adding customer:", error);
    res.status(500).json({ error: "Server error while saving customer" });
  }
});

module.exports = router;