const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const { comparePassword } = require("../utilities/password-utilities")
const jwt = require("jsonwebtoken")
require("dotenv").config()
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
* ************************************ */
accountController.accountLogin = async function(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  const accountData = await accountModel.getAccountByEmail(account_email)
  if (!accountData) {
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
  try {
    ////Having issues with bcrypt, so I seperated it in another utility to test bcrypt or bcryptjs. my code was failing with bcrypt
    if (await comparePassword(account_password, accountData.account_password)) {
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      return res.redirect("/account/")
    }
    else {
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
    throw new Error('Access Forbidden')
  }
}

/* ****************************************
*  Deliver account management view
* *************************************** */
accountController.buildAccountManagement = async function(req, res, next) {
  let nav = await utilities.getNav()
  res.render("account/management", {
    title: "Account Management",
    nav,
    errors: null,
    footer: true
  })
}

/* ****************************************
*  Deliver account update view
* *************************************** */
accountController.buildAccountUpdate = async function(req, res, next) {
  let nav = await utilities.getNav()
  const account_id = parseInt(req.params.accountId)
  
  // Get account data
  const accountData = await accountModel.getAccountById(account_id)
  
  // Check if account data was found
  if (!accountData) {
    req.flash("notice", "Account not found.")
    return res.redirect("/account/")
  }
  
  // Check if user is authorized (only allow users to edit their own account)
  if (res.locals.accountData.account_id !== account_id) {
    req.flash("notice", "You are not authorized to update this account.")
    return res.redirect("/account/")
  }
  
  res.render("account/update", {
    title: "Update Account",
    nav,
    errors: null,
    account_id: accountData.account_id,
    account_firstname: accountData.account_firstname,
    account_lastname: accountData.account_lastname,
    account_email: accountData.account_email,
    footer: true
  })
}

/* ****************************************
*  Process account update
* *************************************** */
accountController.updateAccount = async function(req, res) {
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_id } = req.body
  
  // Check if user is authorized (only allow users to edit their own account)
  if (res.locals.accountData.account_id !== parseInt(account_id)) {
    req.flash("notice", "You are not authorized to update this account.")
    return res.redirect("/account/")
  }
  
  // Check if email is being changed and if it already exists
  const currentAccount = await accountModel.getAccountById(account_id)
  if (currentAccount.account_email !== account_email) {
    const emailExists = await accountModel.checkExistingEmail(account_email)
    if (emailExists) {
      req.flash("notice", "Email address already exists. Please use a different email.")
      return res.status(400).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_id,
        account_firstname,
        account_lastname,
        account_email: currentAccount.account_email, // Return the original email
        footer: true
      })
    }
  }
  
  try {
    const updateResult = await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email
    )
    
    if (updateResult) {
      // Update JWT with new data
      const updatedAccount = await accountModel.getAccountById(account_id)
      delete updatedAccount.account_password
      const accessToken = jwt.sign(updatedAccount, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      
      req.flash("notice", "Account updated successfully.")
      return res.redirect("/account/")
    } else {
      req.flash("notice", "Sorry, the update failed.")
      return res.status(500).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_id,
        account_firstname,
        account_lastname,
        account_email,
        footer: true
      })
    }
  } catch (error) {
    console.error("Update error:", error)
    req.flash("notice", "Sorry, there was an error processing the update.")
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      footer: true
    })
  }
}

/* ****************************************
*  Process password update
* *************************************** */
accountController.updatePassword = async function(req, res) {
  let nav = await utilities.getNav()
  const { account_password, account_id } = req.body
  
  // Check if user is authorized (only allow users to edit their own account)
  if (res.locals.accountData.account_id !== parseInt(account_id)) {
    req.flash("notice", "You are not authorized to update this account password.")
    return res.redirect("/account/")
  }
  
  // Get current account info for the form in case of errors
  const accountData = await accountModel.getAccountById(account_id)
  
  try {
    const updateResult = await accountModel.updatePassword(
      account_id,
      account_password
    )
    
    if (updateResult) {
      req.flash("notice", "Password updated successfully.")
      return res.redirect("/account/")
    } else {
      req.flash("notice", "Sorry, the password update failed.")
      return res.status(500).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_id,
        account_firstname: accountData.account_firstname,
        account_lastname: accountData.account_lastname,
        account_email: accountData.account_email,
        footer: true
      })
    }
  } catch (error) {
    console.error("Password update error:", error)
    req.flash("notice", "Sorry, there was an error processing the password update.")
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_id,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      footer: true
    })
  }
}

/* ****************************************
*  Process logout
* *************************************** */
accountController.accountLogout = async function(req, res) {
  res.clearCookie("jwt")
  req.flash("notice", "You have been logged out.")
  return res.redirect("/")
}

module.exports = accountController 