const express = require("express")
const router = new express.Router()
const utilities = require("../utilities")

// Trigger intentional error
router.get("/trigger-error", utilities.handleErrors(async (req, res, next) => {
  // Throw a 500 error
  throw new Error("Intentional 500 Error")
}))

// Add footer variable to all responses
router.use((req, res, next) => {
  res.locals.footer = true
  next()
})

module.exports = router 