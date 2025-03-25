const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassification = async function (req, res, next) {
  try {
    const classification_id = req.params.classificationId
    console.log("Classification ID:", classification_id)
    
    const data = await invModel.getInventoryByClassification(classification_id)
    console.log("Retrieved data:", data ? data.length : "no data")
    
    if (!data || !data.length) {
      const err = new Error("No vehicles found for this classification")
      err.status = 404
      next(err)
      return
    }

    const grid = await utilities.buildClassificationGrid(data)
    let nav = await utilities.getNav()
    const className = data[0].classification_name
    
    res.render("./inventory/classification", {
      title: className + " vehicles",
      nav,
      grid,
      footer: true
    })
  } catch (error) {
    console.error("Error in buildByClassification:", error)
    next(error)
  }
}

/* ***************************
 *  Build vehicle detail view
 * ************************** */
invCont.buildByInventoryId = async function (req, res, next) {
  try {
    const inventory_id = req.params.inventoryId
    console.log("Inventory ID:", inventory_id)
    
    const vehicle = await invModel.getInventoryByInventoryId(inventory_id)
    console.log("Retrieved vehicle:", vehicle ? "found" : "not found")
    
    if (!vehicle) {
      const err = new Error("Vehicle not found")
      err.status = 404
      next(err)
      return
    }

    const vehicleHtml = await utilities.buildVehicleDetail(vehicle)
    let nav = await utilities.getNav()
    const title = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`
    
    res.render("./inventory/detail", {
      title: title,
      nav,
      vehicleHtml,
      errors: null,
      footer: true
    })
  } catch (error) {
    console.error("Error in buildByInventoryId:", error)
    next(error)
  }
}

module.exports = invCont 