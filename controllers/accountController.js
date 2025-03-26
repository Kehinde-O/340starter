const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const { comparePassword } = require("../utilities/password-utilities")
const accountController = {}

/* ****************************************
*  Deliver login view
* *************************************** */
accountController.buildLogin = async function(req, res, next) {
  let nav = await utilities.getNav()
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    account_email: '',
    footer: true
  })
}

/* ****************************************
*  Deliver registration view
* *************************************** */
accountController.buildRegister = async function(req, res, next) {
  let nav = await utilities.getNav()
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
    account_firstname: '',
    account_lastname: '',
    account_email: '',
    footer: true
  })
}

/* ****************************************
*  Process Registration
* *************************************** */
accountController.registerAccount = async function(req, res) {
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  try {
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      account_password
    )

    if (regResult) {
      req.flash(
        "notice",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      )
      res.status(201).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
        footer: true
      })
    } else {
      req.flash("notice", "Sorry, the registration failed.")
      res.status(501).render("account/register", {
        title: "Registration",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
        footer: true
      })
    }
  } catch (error) {
    console.error("Registration error:", error)
    req.flash("notice", "Sorry, there was an error processing the registration.")
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      footer: true
    })
  }
}

/* ****************************************
*  Process login request
* *************************************** */
accountController.accountLogin = async function(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body

  try {
    const account = await accountModel.getAccountByEmail(account_email)
    
    if (!account) {
      req.flash("notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
        footer: true
      })
      return
    }

    const passwordMatch = await comparePassword(account_password, account.account_password)

    if (passwordMatch) {
      // Store user data in session
      req.session.account_data = {
        account_id: account.account_id,
        account_firstname: account.account_firstname,
        account_type: account.account_type,
      }
      res.redirect("/account/")
    } else {
      req.flash("notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
        footer: true
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    req.flash("notice", "Sorry, there was an error processing the login.")
    res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
      footer: true
    })
  }
}

module.exports = accountController 