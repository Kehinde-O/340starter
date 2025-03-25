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
    console.error("getInventoryByClassification error " + error)
    throw error
  }
}

/* ***************************
 *  Get specific inventory item detail
 * ************************** */
async function getInventoryByInventoryId(inventory_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory 
      WHERE inv_id = $1`,
      [inventory_id]
    )
    console.log("Query result:", data.rows.length ? "found" : "not found")
    return data.rows[0]
  } catch (error) {
    console.error("getInventoryByInventoryId error: " + error)
    throw error
  }
}

module.exports = {getClassifications, getInventoryByClassification, getInventoryByInventoryId}