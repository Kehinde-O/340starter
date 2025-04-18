const pool = require("../database/")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications(){
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}

/* ***************************
 *  Get all inventory items by classification
 * ************************** */
async function getInventoryByClassification(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getInventoryByClassification error: " + error)
    throw error
  }
}

/* ***************************
 *  Get inventory by inventory id (with classification details)
 * ************************** */
async function getInventoryByInventoryId(inventory_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.inv_id = $1`,
      [inventory_id]
    )
    return data.rows[0]
  } catch (error) {
    console.error("getInventoryByInventoryId error: " + error)
    throw error
  }
}

/* ***************************
 *  Check if classification exists
 * ************************** */
async function checkExistingClassification(classification_name) {
  try {
    const sql = "SELECT * FROM classification WHERE classification_name = $1"
    const classification = await pool.query(sql, [classification_name])
    return classification.rowCount
  } catch (error) {
    console.error("Error in checkExistingClassification:", error)
    throw error
  }
}

/* ***************************
 *  Add new classification
 * ************************** */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *"
    const data = await pool.query(sql, [classification_name])
    return data.rows[0]
  } catch (error) {
    console.error("Error in addClassification:", error)
    throw error
  }
}

/* ***************************
 *  Add new inventory item
 * ************************** */
async function addInventory(
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
) {
  try {
    const sql =
      "INSERT INTO inventory (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"
    const data = await pool.query(sql, [
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
    ])
    return data.rows[0]
  } catch (error) {
    console.error("Error in addInventory:", error)
    throw error
  }
}

/* ***************************
 *  Update Inventory Data
 * ************************** */
async function updateInventory(
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
) {
  try {
    const sql =
      "UPDATE public.inventory SET inv_make = $1, inv_model = $2, inv_year = $3, inv_description = $4, inv_image = $5, inv_thumbnail = $6, inv_price = $7, inv_miles = $8, inv_color = $9, classification_id = $10 WHERE inv_id = $11 RETURNING *"
    const data = await pool.query(sql, [
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
      inv_id
    ])
    return data.rows[0]
  } catch (error) {
    console.error("model error: " + error)
    return error.message
  }
}

/* ***************************
 *  Delete Inventory Item
 * ************************** */
async function deleteInventoryItem(inv_id) {
  try {
    const sql = 'DELETE FROM inventory WHERE inv_id = $1'
    const data = await pool.query(sql, [inv_id])
    return data
  } catch (error) {
    console.error("Delete Inventory Error: " + error)
    throw error
  }
}

/* ***************************
 *  Get all inventory items
 * ************************** */
async function getAllInventory() {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory ORDER BY inv_id`
    )
    return data.rows
  } catch (error) {
    console.error("getAllInventory error: " + error)
    throw error
  }
}

/* ***************************
 *  Update inventory table with primary image
 * ************************** */
async function updateInventoryImage(inventory_id, image_path) {
  try {
    const sql = 
      "UPDATE inventory SET inv_image = $1, inv_thumbnail = $1 WHERE inv_id = $2 RETURNING *"
    const data = await pool.query(sql, [image_path, inventory_id])
    return data.rows[0]
  } catch (error) {
    console.error("Error in updateInventoryImage:", error)
    throw error
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassification,
  getInventoryByInventoryId,
  checkExistingClassification,
  addClassification,
  addInventory,
  updateInventory,
  deleteInventoryItem,
  getAllInventory,
  updateInventoryImage,
}