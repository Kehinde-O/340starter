const pool = require("../database/")

/* ***************************
 *  Get images by inventory ID
 * ************************** */
async function getImagesByInventoryId(inventory_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory_images 
       WHERE inventory_id = $1
       ORDER BY primary_image DESC, created_at ASC`,
      [inventory_id]
    )
    return data.rows
  } catch (error) {
    console.error("getImagesByInventoryId error: " + error)
    throw error
  }
}

/* ***************************
 *  Get primary image by inventory ID
 * ************************** */
async function getPrimaryImage(inventory_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory_images 
       WHERE inventory_id = $1 AND primary_image = true 
       LIMIT 1`,
      [inventory_id]
    )
    return data.rows[0] || null
  } catch (error) {
    console.error("getPrimaryImage error: " + error)
    throw error
  }
}

/* ***************************
 *  Add new image
 * ************************** */
async function addImage(inventory_id, image_path, thumbnail_path, primary_image = false) {
  try {
    // If this is a primary image, reset other primary images for this inventory item
    if (primary_image) {
      await pool.query(
        "UPDATE inventory_images SET primary_image = false WHERE inventory_id = $1",
        [inventory_id]
      )
    }
    
    const sql = 
      "INSERT INTO inventory_images (inventory_id, image_path, thumbnail_path, primary_image) VALUES ($1, $2, $3, $4) RETURNING *"
    const data = await pool.query(sql, [
      inventory_id,
      image_path,
      thumbnail_path,
      primary_image
    ])
    return data.rows[0]
  } catch (error) {
    console.error("Error in addImage:", error)
    throw error
  }
}

/* ***************************
 *  Update image
 * ************************** */
async function updateImage(image_id, image_path, thumbnail_path, primary_image) {
  try {
    // Get inventory_id for this image
    const imgData = await pool.query("SELECT inventory_id FROM inventory_images WHERE image_id = $1", [image_id])
    if (!imgData.rows[0]) {
      throw new Error("Image not found")
    }
    
    const inventory_id = imgData.rows[0].inventory_id
    
    // If this is a primary image, reset other primary images for this inventory item
    if (primary_image) {
      await pool.query(
        "UPDATE inventory_images SET primary_image = false WHERE inventory_id = $1",
        [inventory_id]
      )
    }
    
    const sql = 
      "UPDATE inventory_images SET image_path = $1, thumbnail_path = $2, primary_image = $3 WHERE image_id = $4 RETURNING *"
    const data = await pool.query(sql, [image_path, thumbnail_path, primary_image, image_id])
    return data.rows[0]
  } catch (error) {
    console.error("Error in updateImage:", error)
    throw error
  }
}

/* ***************************
 *  Set image as primary
 * ************************** */
async function setPrimaryImage(image_id) {
  try {
    // Get inventory_id for this image
    const imgData = await pool.query("SELECT inventory_id FROM inventory_images WHERE image_id = $1", [image_id])
    if (!imgData.rows[0]) {
      throw new Error("Image not found")
    }
    
    const inventory_id = imgData.rows[0].inventory_id
    
    // Reset all primary images for this inventory
    await pool.query(
      "UPDATE inventory_images SET primary_image = false WHERE inventory_id = $1",
      [inventory_id]
    )
    
    // Set this image as primary
    const sql = "UPDATE inventory_images SET primary_image = true WHERE image_id = $1 RETURNING *"
    const data = await pool.query(sql, [image_id])
    return data.rows[0]
  } catch (error) {
    console.error("Error in setPrimaryImage:", error)
    throw error
  }
}

/* ***************************
 *  Delete image
 * ************************** */
async function deleteImage(image_id) {
  try {
    const sql = "DELETE FROM inventory_images WHERE image_id = $1"
    const data = await pool.query(sql, [image_id])
    return data
  } catch (error) {
    console.error("Error in deleteImage:", error)
    throw error
  }
}

module.exports = {
  getImagesByInventoryId,
  getPrimaryImage,
  addImage,
  updateImage,
  setPrimaryImage,
  deleteImage
} 