const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
const imageController = require("../controllers/imageController")

const invCont = {}

/* ***************************
 *  Build management view
 * ************************** */
invCont.buildManagement = async function (req, res, next) {
  let nav = await utilities.getNav()
  const classificationSelect = await utilities.buildClassificationList()
  
  res.render("./inventory/management", {
    title: "Vehicle Management",
    nav,
    classificationSelect,
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
  let nav = await utilities.getNav()
  let grid
  if(data.length > 0) {
    grid = await utilities.buildClassificationGrid(data)
    const className = data[0].classification_name
    res.render("./inventory/classification", {
      title: className + " vehicles",
      nav,
      grid,
      footer: true
    })
  } else {
    res.render("./inventory/classification", {
      title: "No Vehicles Found",
      nav,
      grid: "<p class='notice'>Sorry, no vehicles could be found.</p>",
      footer: true
    })
  }
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
      const classificationSelect = await utilities.buildClassificationList()
      res.status(201).render("inventory/management", {
        title: "Vehicle Management",
        nav,
        classificationSelect,
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
    inv_color,
    classification_id 
  } = req.body
  
  const addResult = await invModel.addInventory(
    inv_make, 
    inv_model, 
    inv_year, 
    inv_description, 
    inv_image, 
    inv_thumbnail, 
    inv_price, 
    inv_miles, 
    inv_color,
    classification_id
  )
  
  if (addResult) {
    req.flash(
      "notice",
      `The ${inv_make} ${inv_model} was successfully added.`
    )
    let classifications = await utilities.buildClassificationList()
    res.status(201).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classifications,
      errors: null,
      footer: true,
    })
  } else {
    req.flash("notice", "Sorry, the addition failed.")
    let classifications = await utilities.buildClassificationList()
    res.status(501).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classifications,
      inv_make, 
      inv_model, 
      inv_year, 
      inv_description, 
      inv_image, 
      inv_thumbnail, 
      inv_price, 
      inv_miles, 
      inv_color,
      classification_id,
      footer: true,
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

    // Ensure backward compatibility with the image system
    await imageController.ensureBackwardCompatibility(inventory_id)

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

/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  try {
    if (req.params.classification_id) {
      const classification_id = parseInt(req.params.classification_id)
      const invData = await invModel.getInventoryByClassification(classification_id)
      if (invData.length > 0) {
        return res.json(invData)
      } else {
        next(new Error("No data returned"))
      }
    } else if (req.params.inventoryId) {
      const inventory_id = parseInt(req.params.inventoryId)
      const invData = await invModel.getInventoryByInventoryId(inventory_id)
      if (invData) {
        return res.json(invData)
      } else {
        next(new Error("No data returned"))
      }
    } else {
      next(new Error("Invalid parameter"))
    }
  } catch (error) {
    console.error("getInventoryJSON error: " + error)
    next(error)
  }
}

/* ***************************
 *  Build edit inventory view
 * ************************** */
invCont.buildEditInventory = async function (req, res, next) {
  const inv_id = parseInt(req.params.inventoryId)
  let nav = await utilities.getNav()
  const itemData = await invModel.getInventoryByInventoryId(inv_id)
  const classificationSelect = await utilities.buildClassificationList(itemData.classification_id)
  const itemName = `${itemData.inv_make} ${itemData.inv_model}`
  res.render("./inventory/edit-inventory", {
    title: "Edit " + itemName,
    nav,
    classificationSelect,
    errors: null,
    inv_id: itemData.inv_id,
    inv_make: itemData.inv_make,
    inv_model: itemData.inv_model,
    inv_year: itemData.inv_year,
    inv_description: itemData.inv_description,
    inv_image: itemData.inv_image,
    inv_thumbnail: itemData.inv_thumbnail,
    inv_price: itemData.inv_price,
    inv_miles: itemData.inv_miles,
    inv_color: itemData.inv_color,
    classification_id: itemData.classification_id,
    footer: true
  })
}

/* ***************************
 *  Update Inventory Data
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
  let nav = await utilities.getNav()
  const {
    inv_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body
  
  const updateResult = await invModel.updateInventory(
    inv_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id
  )

  if (updateResult && typeof updateResult === 'object') {
    req.flash(
      "notice",
      `The ${inv_make} ${inv_model} was successfully updated.`
    )
    res.redirect("/inv/")
  } else {
    const errorMessage = typeof updateResult === 'string' ? updateResult : "Sorry, the update failed."
    req.flash("notice", errorMessage)
    const itemName = `${inv_make} ${inv_model}`
    const classifications = await utilities.buildClassificationList(classification_id)
    res.status(501).render("inventory/edit-inventory", {
      title: "Edit " + itemName,
      nav,
      classifications,
      errors: null,
      inv_id,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
      footer: true
    })
  }
}

/* ***************************
 *  Build delete confirmation view
 * ************************** */
invCont.buildDeleteConfirm = async function (req, res, next) {
  const inv_id = parseInt(req.params.inventoryId)
  let nav = await utilities.getNav()
  const itemData = await invModel.getInventoryByInventoryId(inv_id)
  if (itemData) {
    const itemName = `${itemData.inv_make} ${itemData.inv_model}`
    res.render("./inventory/delete-confirm", {
      title: "Delete " + itemName,
      nav,
      errors: null,
      inv_id: itemData.inv_id,
      inv_make: itemData.inv_make,
      inv_model: itemData.inv_model,
      inv_year: itemData.inv_year,
      inv_price: itemData.inv_price,
      footer: true
    })
  } else {
    const err = new Error("Sorry, we couldn't find that inventory item")
    err.status = 404
    next(err)
  }
}

/* ***************************
 *  Process Delete Inventory
 * ************************** */
invCont.deleteInventory = async function (req, res, next) {
  const inv_id = parseInt(req.body.inv_id)
  const itemName = req.body.inv_make + " " + req.body.inv_model
  const nav = await utilities.getNav()
  const deleteResult = await invModel.deleteInventoryItem(inv_id)
  
  if (deleteResult && typeof deleteResult === 'object') {
    req.flash("notice", `The ${itemName} was successfully deleted.`)
    res.redirect("/inv/")
  } else {
    const errorMessage = typeof deleteResult === 'string' ? deleteResult : "Sorry, the delete failed."
    req.flash("notice", errorMessage)
    res.status(501).render("inventory/delete-confirm", {
      title: "Delete " + itemName,
      nav,
      errors: null,
      inv_id,
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_year: req.body.inv_year,
      inv_price: req.body.inv_price,
      classification_id: req.body.classification_id,
      footer: true
    })
  }
}

module.exports = invCont 