const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build management view
 * ************************** */
invCont.buildManagement = async function (req, res, next) {
  let nav = await utilities.getNav()
  res.render("./inventory/management", {
    title: "Vehicle Management",
    nav,
    errors: null,
    footer: true
  })
}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassification = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassification(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
    footer: true
  })
}

/* ***************************
 *  Build add classification view
 * ************************** */
invCont.buildAddClassification = async function (req, res, next) {
  let nav = await utilities.getNav()
  res.render("./inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null,
    footer: true
  })
}

/* ***************************
 *  Process Add Classification
 * ************************** */
invCont.addClassification = async function (req, res) {
  const { classification_name } = req.body
  
  try {
    const result = await invModel.addClassification(classification_name)
    
    if (result) {
      req.flash(
        "notice",
        `The ${classification_name} classification was successfully added.`
      )
      let nav = await utilities.getNav()
      res.status(201).render("inventory/management", {
        title: "Vehicle Management",
        nav,
        errors: null,
        footer: true
      })
    } else {
      req.flash("notice", "Sorry, adding the classification failed.")
      res.status(501).render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        errors: null,
        classification_name,
        footer: true
      })
    }
  } catch (error) {
    console.error("Add Classification Error:", error)
    req.flash("notice", "Sorry, there was an error processing the request.")
    res.status(500).render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: null,
      classification_name,
      footer: true
    })
  }
}

/* ***************************
 *  Build add inventory view
 * ************************** */
invCont.buildAddInventory = async function (req, res, next) {
  let nav = await utilities.getNav()
  let classifications = await utilities.buildClassificationList()
  res.render("./inventory/add-inventory", {
    title: "Add New Vehicle",
    nav,
    classifications,
    errors: null,
    footer: true
  })
}

/* ***************************
 *  Process Add Inventory
 * ************************** */
invCont.addInventory = async function (req, res) {
  let nav = await utilities.getNav()
  const {
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    classification_id,
  } = req.body

  try {
    const result = await invModel.addInventory(
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      classification_id
    )

    if (result) {
      req.flash(
        "notice",
        `The ${inv_make} ${inv_model} was successfully added.`
      )
      res.status(201).render("inventory/management", {
        title: "Vehicle Management",
        nav,
        errors: null,
        footer: true
      })
    } else {
      req.flash("notice", "Sorry, adding the vehicle failed.")
      res.status(501).render("inventory/add-inventory", {
        title: "Add New Vehicle",
        nav,
        classifications: await utilities.buildClassificationList(classification_id),
        errors: null,
        inv_make,
        inv_model,
        inv_year,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_miles,
        classification_id,
        footer: true
      })
    }
  } catch (error) {
    console.error("Add Inventory Error:", error)
    req.flash("notice", "Sorry, there was an error processing the request.")
    res.status(500).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classifications: await utilities.buildClassificationList(classification_id),
      errors: null,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      classification_id,
      footer: true
    })
  }
}

/* ***************************
 *  Build vehicle detail view
 * ************************** */
invCont.buildByInventoryId = async function (req, res, next) {
  try {
    const inventory_id = req.params.inventoryId
    const vehicle = await invModel.getInventoryByInventoryId(inventory_id)
    
    if (!vehicle) {
      const err = new Error("Vehicle not found")
      err.status = 404
      next(err)
      return
    }

    let nav = await utilities.getNav()
    const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`
    
    res.render("./inventory/detail", {
      title: title,
      nav,
      vehicle,
      errors: null,
      footer: true
    })
  } catch (error) {
    console.error("Error in buildByInventoryId:", error)
    next(error)
  }
}

module.exports = invCont 