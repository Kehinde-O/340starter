const pool = require("../database/")

/* ***************************
 *  Get reviews by inventory ID
 * ************************** */
async function getReviewsByInventoryId(inventory_id) {
  try {
    console.log(`DB query: Getting reviews for inventory ID ${inventory_id}`)
    
    const data = await pool.query(
      `SELECT r.*, a.account_firstname, a.account_lastname 
      FROM public.reviews AS r 
      JOIN public.account AS a 
      ON r.account_id = a.account_id 
      WHERE r.inventory_id = $1
      ORDER BY r.created_at DESC`,
      [inventory_id]
    )
    
    console.log(`DB result: Found ${data.rows.length} reviews`)
    // Log first review if any exist
    if (data.rows.length > 0) {
      console.log('Sample review data:', {
        review_id: data.rows[0].review_id,
        account_id: data.rows[0].account_id,
        rating: data.rows[0].rating,
        text_length: data.rows[0].review_text?.length
      })
    }
    
    return data.rows
  } catch (error) {
    console.error("getReviewsByInventoryId error:", error)
    // Return empty array instead of throwing to prevent page crashes
    return []
  }
}

/* ***************************
 *  Get average rating by inventory ID
 * ************************** */
async function getAverageRating(inventory_id) {
  try {
    console.log(`DB query: Getting average rating for inventory ID ${inventory_id}`)
    
    const data = await pool.query(
      `SELECT AVG(rating) as average_rating 
      FROM public.reviews 
      WHERE inventory_id = $1`,
      [inventory_id]
    )
    
    const avgRating = data.rows[0].average_rating || 0
    console.log(`DB result: Average rating ${avgRating}`)
    
    return avgRating
  } catch (error) {
    console.error("getAverageRating error:", error)
    // Return 0 instead of throwing to prevent page crashes
    return 0
  }
}

/* ***************************
 *  Add new review
 * ************************** */
async function addReview(inventory_id, account_id, rating, review_text) {
  try {
    const sql = 
      "INSERT INTO reviews (inventory_id, account_id, rating, review_text) VALUES ($1, $2, $3, $4) RETURNING *"
    const data = await pool.query(sql, [
      inventory_id,
      account_id,
      rating,
      review_text
    ])
    return data.rows[0]
  } catch (error) {
    console.error("Error in addReview:", error)
    throw error
  }
}

/* ***************************
 *  Update review
 * ************************** */
async function updateReview(review_id, rating, review_text) {
  try {
    const sql = 
      "UPDATE reviews SET rating = $1, review_text = $2 WHERE review_id = $3 RETURNING *"
    const data = await pool.query(sql, [rating, review_text, review_id])
    return data.rows[0]
  } catch (error) {
    console.error("Error in updateReview:", error)
    throw error
  }
}

/* ***************************
 *  Delete review
 * ************************** */
async function deleteReview(review_id) {
  try {
    const sql = "DELETE FROM reviews WHERE review_id = $1"
    const data = await pool.query(sql, [review_id])
    return data
  } catch (error) {
    console.error("Error in deleteReview:", error)
    throw error
  }
}

/* ***************************
 *  Check if user has already reviewed this item
 * ************************** */
async function checkExistingReview(inventory_id, account_id) {
  try {
    const sql = "SELECT * FROM reviews WHERE inventory_id = $1 AND account_id = $2"
    const data = await pool.query(sql, [inventory_id, account_id])
    return data.rowCount > 0 ? data.rows[0] : null
  } catch (error) {
    console.error("Error in checkExistingReview:", error)
    throw error
  }
}

module.exports = {
  getReviewsByInventoryId,
  getAverageRating,
  addReview,
  updateReview,
  deleteReview,
  checkExistingReview
} 