// Needed Resources
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const invValidate = require("../utilities/inventory-validation")

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

module.exports = router 