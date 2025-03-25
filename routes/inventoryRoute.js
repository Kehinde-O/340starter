// Needed Resources
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
const utilities = require("../utilities")

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassification))

// Route to build a specific vehicle detail view
router.get("/detail/:inventoryId", utilities.handleErrors(invController.buildByInventoryId))

module.exports = router 