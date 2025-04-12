const { body, validationResult } = require("express-validator")
const validate = {}

/*  **********************************
 *  Review Data Validation Rules
 * ********************************* */
validate.reviewRules = () => {
  return [
    // rating is required and must be between 1 and 5
    body("rating")
      .trim()
      .isInt({ min: 1, max: 5 })
      .withMessage("Please provide a rating between 1 and 5"),

    // review_text is required and must be string
    body("review_text")
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage("Review must be between 5 and 1000 characters"),
  ]
}

/* ******************************
 * Check data and return errors or continue to review
 * ***************************** */
validate.checkReviewData = async (req, res, next) => {
  const { inventory_id } = req.body
  let errors = validationResult(req)
  if (!errors.isEmpty()) {
    // Store error messages
    req.flash("notice", errors.array().map(error => error.msg).join(', '))
    return res.redirect(`/inv/detail/${inventory_id}`)
  }
  next()
}

module.exports = validate 