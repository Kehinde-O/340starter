const { body, validationResult } = require("express-validator")
const invModel = require("../models/inventory-model")
const utilities = require(".")

const validate = {}

/*  **********************************
 *  Classification Data Validation Rules
 * ********************************* */
validate.classificationRules = () => {
    return [
        // classification_name is required and must be string of capital letters only
        body("classification_name")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Please provide a classification name.") // on error this message is sent
        .matches(/^[A-Z]+$/)
        .withMessage("Classification name must contain only capital letters.")
        .custom(async (classification_name) => {
            const classificationExists = await invModel.checkExistingClassification(classification_name)
            if (classificationExists){
                throw new Error("Classification already exists. Please use a different name.")
            }
        }),
    ]
}

/*  **********************************
 *  Inventory Data Validation Rules
 * ********************************* */
validate.inventoryRules = () => {
    return [
        // inv_make is required and must be string
        body("inv_make")
        .trim()
        .isLength({ min: 3 })
        .withMessage("Please provide a valid vehicle make."),

        // inv_model is required and must be string
        body("inv_model")
        .trim()
        .isLength({ min: 3 })
        .withMessage("Please provide a valid vehicle model."),

        // inv_year is required and must be 4-digit year
        body("inv_year")
        .trim()
        .isLength({ min: 4, max: 4 })
        .isNumeric()
        .withMessage("Please provide a valid 4-digit year."),

        // inv_description is required
        body("inv_description")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Please provide a vehicle description."),

        // inv_image is required and must be a valid path
        body("inv_image")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Please provide an image path."),

        // inv_thumbnail is required and must be a valid path
        body("inv_thumbnail")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Please provide a thumbnail path."),

        // inv_price is required and must be numeric
        body("inv_price")
        .trim()
        .isNumeric()
        .withMessage("Please provide a valid price."),

        // inv_miles is required and must be numeric
        body("inv_miles")
        .trim()
        .isNumeric()
        .withMessage("Please provide valid mileage."),

        // inv_color is required
        body("inv_color")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Please provide a vehicle color."),

        // classification_id is required and must exist in database
        body("classification_id")
        .trim()
        .isNumeric()
        .withMessage("Please select a valid classification.")
    ]
}

/*  **********************************
 *  Check data and return errors or continue to registration
 * ********************************* */
validate.checkClassificationData = async (req, res, next) => {
    const { classification_name } = req.body
    let errors = validationResult(req)

    // Server-side check for capital letters only
    const capitalLettersOnly = /^[A-Z]+$/.test(classification_name)
    if (!capitalLettersOnly) {
        errors = {
            isEmpty: () => false,
            array: () => [{
                msg: "Server: Classification name must contain only capital letters."
            }]
        }
    }

    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        res.render("inventory/add-classification", {
            errors,
            title: "Add New Classification",
            nav,
            classification_name,
            footer: true
        })
        return
    }
    next()
}

/*  **********************************
 *  Check data and return errors or continue to registration
 * ********************************* */
validate.checkInventoryData = async (req, res, next) => {
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
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        let classifications = await utilities.buildClassificationList()
        res.render("inventory/add-inventory", {
            errors,
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
            classification_id,
            footer: true
        })
        return
    }
    next()
}

/*  **********************************
 *  Check data and return errors or continue to update
 * ********************************* */
validate.checkUpdateData = async (req, res, next) => {
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
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        let classifications = await utilities.buildClassificationList(classification_id)
        const itemName = `${inv_make} ${inv_model}`
        res.render("inventory/edit-inventory", {
            errors,
            title: "Edit " + itemName,
            nav,
            classifications,
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
        return
    }
    next()
}

module.exports = validate 