/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const env = require("dotenv").config()
const app = express()
const static = require("./routes/static")
const expressLayouts = require("express-ejs-layouts")
const baseController = require("./controllers/baseController")
const utilities = require("./utilities/")
const session = require("express-session")
const pool = require('./database/')
const inventoryRoute = require("./routes/inventoryRoute")
const cookieParser = require("cookie-parser")

/* ***********************
 * Middleware
 *************************/
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))

// Express Messages Middleware
app.use(require('connect-flash')())
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res)
  next()
})

// Body Parser Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Cookie Parser Middleware
app.use(cookieParser())

// Request Logger Middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url.includes('/images/upload')) {
    console.log('Image Upload Request Details:');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
  }
  next();
});

// JWT Token Middleware
app.use(utilities.checkJWTToken)

app.use(static)

app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")

/* ***********************
 * Routes
 *************************/
app.use(require("./routes/static"))

// Index route
app.get("/", utilities.handleErrors(baseController.buildHome))

// Inventory routes
app.use("/inv", require("./routes/inventoryRoute"))

// Account routes
app.use("/account", require("./routes/accountRoute"))

// Add error route
app.use("/", require("./routes/errorRoute"))

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav()
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  let message
  if(err.status == 404){ 
    message = err.message
  } else {
    message = 'Oh no! There was a crash. Maybe try a different route?'
  }
  res.render("errors/error", {
    title: err.status || 'Server Error',
    message,
    nav,
    footer: true
  })
})

// File Not Found Route - must be last route in list
app.use(async (req, res, next) => {
  next({status: 404, message: 'Sorry, we appear to have lost that page.'})
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT
const host = process.env.HOST

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
  
  // Ensure all required tables exist
  try {
    const { ensureInventoryImagesTable, ensureReviewsTable } = require('./database/ensure-tables')
    
    Promise.all([
      ensureInventoryImagesTable(),
      ensureReviewsTable()
    ])
      .then(results => {
        const allSuccessful = results.every(success => success);
        if (allSuccessful) {
          console.log("Database tables verified")
        } else {
          console.warn("Database table verification failed, some features may not work correctly")
        }
      })
      .catch(err => {
        console.error("Error verifying database tables:", err)
      })
  } catch (error) {
    console.error("Error importing table verification module:", error)
  }
})
