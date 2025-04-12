// Needed Resources
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const invValidate = require("../utilities/inventory-validation")
const reviewController = require("../controllers/reviewController")
const imageController = require("../controllers/imageController")
const reviewValidate = require("../utilities/review-validation")
const multer = require("multer")
const path = require("path")

// Setup storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/vehicles"))
  },
  filename: function (req, file, cb) {
    // Use the original name with a timestamp to avoid name conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const fileExtension = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension)
  }
})

// File filter for multer
const fileFilter = (req, file, cb) => {
  console.log("Validating file:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Define allowed file types
  const filetypes = /jpeg|jpg|png|gif/
  
  // Check the file mimetype
  const mimetype = filetypes.test(file.mimetype)
  
  // Check the file extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  
  if (mimetype && extname) {
    console.log("File validation passed");
    return cb(null, true)
  }
  
  // Create more detailed error message
  const fileExtension = path.extname(file.originalname).toLowerCase() || 'unknown';
  const errorMessage = `Invalid file format: ${fileExtension}. Please upload a JPG, JPEG, PNG, or GIF image.`;
  
  console.log("File validation failed:", {
    filename: file.originalname,
    mimetype: file.mimetype,
    extension: path.extname(file.originalname),
    error: errorMessage
  })
  
  // Store the error directly on the request object
  req.fileValidationError = errorMessage
  
  // Return with false to reject the file
  return cb(null, false, new Error(errorMessage))
}

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 1024 * 1024 * 5, // 5MB file size limit
  },
  fileFilter: fileFilter
})

// Error handling middleware for multer uploads
const handleUploadError = (req, res, next) => {
  return (err) => {
    console.error("Upload middleware error:", err);
    const inventory_id = req.body.inventory_id;
    
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.flash("notice", "File size exceeds the 5MB limit. Please choose a smaller file.");
      } else {
        req.flash("notice", `Upload error: ${err.code} - ${err.message}`);
      }
    } else if (err) {
      req.flash("notice", `Upload error: ${err.message}`);
    }
    
    if (inventory_id) {
      return res.redirect(`/inv/images/${inventory_id}`);
    } else {
      return res.redirect("/inv");
    }
  };
};

// Route to build management view - Protected
router.get("/", utilities.checkJWTToken, utilities.checkAccountType, utilities.handleErrors(invController.buildManagement))

// Route to build inventory by classification view - Public
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassification))

// Route to build inventory detail view - Public
router.get("/detail/:inventoryId", utilities.handleErrors(invController.buildByInventoryId))

// Route to get inventory as JSON - Public
router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON))

// Route to build edit inventory view - Protected
router.get("/edit/:inventoryId", utilities.checkJWTToken, utilities.checkAccountType, utilities.handleErrors(invController.buildEditInventory))

// Process the edit inventory data - Protected
router.post("/update", utilities.checkJWTToken, utilities.checkAccountType, invValidate.inventoryRules(), invValidate.checkUpdateData, utilities.handleErrors(invController.updateInventory))

// Route to get inventory data for a specific inventory item - Public
router.get("/getInventory/:inventoryId", utilities.handleErrors(invController.getInventoryJSON))

// Route to build add classification form - Protected
router.get("/add-classification", utilities.checkJWTToken, utilities.checkAccountType, utilities.handleErrors(invController.buildAddClassification))

// Route to process add classification - Protected
router.post(
  "/add-classification",
  utilities.checkJWTToken,
  utilities.checkAccountType,
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  utilities.handleErrors(invController.addClassification)
)

// Route to build add inventory form - Protected
router.get("/add-inventory", utilities.checkJWTToken, utilities.checkAccountType, utilities.handleErrors(invController.buildAddInventory))

// Route to process add inventory - Protected
router.post(
  "/add-inventory",
  utilities.checkJWTToken,
  utilities.checkAccountType,
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  utilities.handleErrors(invController.addInventory)
)

// Route to build delete confirmation view - Protected
router.get("/delete/:inventoryId", utilities.checkJWTToken, utilities.checkAccountType, utilities.handleErrors(invController.buildDeleteConfirm))

// Process the deletion - Protected
router.post("/delete", utilities.checkJWTToken, utilities.checkAccountType, utilities.handleErrors(invController.deleteInventory))

// Reviews Routes
router.get("/reviews/:inventoryId", utilities.handleErrors(reviewController.getReviews))
router.post(
  "/reviews/add",
  utilities.checkLogin,
  reviewValidate.reviewRules(),
  reviewValidate.checkReviewData,
  utilities.handleErrors(reviewController.addReview)
)
router.post(
  "/reviews/update",
  utilities.checkLogin,
  reviewValidate.reviewRules(),
  reviewValidate.checkReviewData,
  utilities.handleErrors(reviewController.updateReview)
)
router.post(
  "/reviews/delete",
  utilities.checkLogin,
  utilities.handleErrors(reviewController.deleteReview)
)

// Image Management Routes
router.get("/images/:inventoryId", utilities.checkJWTToken, utilities.checkAccountType, utilities.handleErrors(imageController.buildAddImage))
router.get("/getImages/:inventoryId", utilities.handleErrors(imageController.getImages))
router.post(
  "/images/upload",
  utilities.checkJWTToken,
  utilities.checkAccountType,
  (req, res, next) => {
    upload.single('vehicle_image')(req, res, (err) => {
      // Get the inventory_id from the form data for redirects
      const inventory_id = req.body.inventory_id
      
      // Handle Multer errors (like file size)
      if (err) {
        console.log("Multer error during upload:", err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            req.flash("error", "The uploaded file is too large. Please upload an image under 5MB.")
          } else {
            req.flash("error", `Upload error: ${err.message}`)
          }
        } else {
          req.flash("error", `Upload error: ${err.message}`)
        }
        return res.redirect(`/inv/images/${inventory_id}`)
      }
      
      // Check for file validation error (invalid type)
      if (req.fileValidationError) {
        console.log("File validation error:", req.fileValidationError)
        req.flash("error", req.fileValidationError)
        return res.redirect(`/inv/images/${inventory_id}`)
      }
      
      // If no file was selected
      if (!req.file) {
        console.log("No file uploaded")
        req.flash("notice", "Please select a file to upload")
        return res.redirect(`/inv/images/${inventory_id}`)
      }
      
      // If we got here, validation passed and we have a file
      console.log("File validation successful, proceeding to next middleware")
      next()
    })
  },
  utilities.handleErrors(imageController.uploadImage)
)

// Test Image Upload (for debugging)
router.get("/test-upload-page", utilities.handleErrors(async (req, res) => {
  let nav = await utilities.getNav()
  res.render("./inventory/test-upload", {
    title: "Test Image Upload",
    nav,
    errors: null,
    footer: true
  })
}))

router.post(
  "/test-upload",
  (req, res, next) => {
    upload.single('vehicle_image')(req, res, (err) => {
      if (err) {
        console.log("Multer error during test upload:", err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            req.flash("error", "The uploaded file is too large. Please upload an image under 5MB.")
          } else {
            req.flash("error", `Upload error: ${err.message}`)
          }
        } else {
          req.flash("error", `Upload error: ${err.message}`)
        }
        return res.redirect("/inv/test-upload-page")
      }
      
      // Check for file validation error (invalid type)
      if (req.fileValidationError) {
        console.log("File validation error:", req.fileValidationError)
        req.flash("error", req.fileValidationError)
        return res.redirect("/inv/test-upload-page")
      }
      
      // If we got here, validation passed
      next()
    })
  },
  utilities.handleErrors(async (req, res) => {
    console.log("TEST UPLOAD RECEIVED:", { 
      body: req.body,
      file: req.file
    })
    
    try {
      if (!req.file) {
        console.log("No file in test upload")
        req.flash("notice", "Please select a file to upload")
        return res.redirect("/inv/test-upload-page")
      }
      
      console.log("Test file received:", req.file)
      req.flash("success", "Test file received: " + req.file.filename)
      res.redirect("/inv/test-upload-page")
    } catch (error) {
      console.error("Test upload error:", error)
      req.flash("error", "Error: " + error.message)
      res.redirect("/inv/test-upload-page")
    }
  })
)

// Admin Tools
router.get(
  "/admin/migrate-images",
  utilities.checkJWTToken,
  utilities.checkAccountType,
  utilities.handleErrors(imageController.migrateAllInventoryImages)
)

module.exports = router 