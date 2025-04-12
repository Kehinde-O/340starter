const reviewModel = require("../models/review-model")
const utilities = require("../utilities/")

const reviewController = {}

/* ***************************
 *  Get reviews for specific inventory
 * ************************** */
reviewController.getReviews = async function (req, res, next) {
  try {
    const inventory_id = req.params.inventoryId
    console.log(`Fetching reviews for inventory ID: ${inventory_id}`)
    
    const reviews = await reviewModel.getReviewsByInventoryId(inventory_id)
    console.log(`Found ${reviews.length} reviews`)
    
    const averageRating = await reviewModel.getAverageRating(inventory_id)
    console.log(`Average rating: ${averageRating}`)
    
    // Ensure averageRating is a number or default to 0
    const formattedAverage = averageRating ? parseFloat(averageRating).toFixed(1) : "0.0"
    
    const response = { 
      reviews, 
      averageRating: formattedAverage
    }
    
    console.log(`Sending review response with ${reviews.length} reviews`)
    res.status(200).json(response)
  } catch (error) {
    console.error("Error getting reviews:", error)
    // Send an empty response rather than an error to avoid breaking the page
    res.status(200).json({ 
      reviews: [], 
      averageRating: "0.0",
      error: error.message 
    })
  }
}

/* ***************************
 *  Process new review
 * ************************** */
reviewController.addReview = async function (req, res, next) {
  try {
    const { inventory_id, rating, review_text } = req.body
    const account_id = res.locals.accountData.account_id
    
    console.log('Processing new review:', {
      inventory_id,
      rating,
      text_length: review_text?.length,
      account_id
    })
    
    // Convert rating to number and validate
    const numericRating = parseInt(rating)
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      req.flash("notice", "Invalid rating value. Please select a rating between 1 and 5.")
      return res.redirect(`/inv/detail/${inventory_id}`)
    }
    
    // Check if user already reviewed this item
    const existingReview = await reviewModel.checkExistingReview(inventory_id, account_id)
    if (existingReview) {
      req.flash("notice", "You have already reviewed this item. You can update your review instead.")
      return res.redirect(`/inv/detail/${inventory_id}`)
    }
    
    // Add the review
    const result = await reviewModel.addReview(inventory_id, account_id, numericRating, review_text)
    console.log('Review added successfully:', result)
    
    req.flash("success", "Your review has been added successfully.")
    res.redirect(`/inv/detail/${inventory_id}`)
  } catch (error) {
    console.error("Error adding review:", error)
    req.flash("notice", "An error occurred while adding your review.")
    res.redirect(`/inv/detail/${req.body.inventory_id}`)
  }
}

/* ***************************
 *  Process update review
 * ************************** */
reviewController.updateReview = async function (req, res, next) {
  try {
    const { review_id, inventory_id, rating, review_text } = req.body
    
    // Update the review
    await reviewModel.updateReview(review_id, rating, review_text)
    
    req.flash("success", "Your review has been updated successfully.")
    res.redirect(`/inv/detail/${inventory_id}`)
  } catch (error) {
    console.error("Error updating review:", error)
    req.flash("notice", "An error occurred while updating your review.")
    res.redirect(`/inv/detail/${req.body.inventory_id}`)
  }
}

/* ***************************
 *  Process delete review
 * ************************** */
reviewController.deleteReview = async function (req, res, next) {
  try {
    const { review_id, inventory_id } = req.body
    
    // Delete the review
    await reviewModel.deleteReview(review_id)
    
    req.flash("success", "Your review has been deleted successfully.")
    res.redirect(`/inv/detail/${inventory_id}`)
  } catch (error) {
    console.error("Error deleting review:", error)
    req.flash("notice", "An error occurred while deleting your review.")
    res.redirect(`/inv/detail/${req.body.inventory_id}`)
  }
}

module.exports = reviewController 