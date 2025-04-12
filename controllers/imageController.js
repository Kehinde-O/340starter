const imageModel = require("../models/image-model")
const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
const fs = require("fs")
const path = require("path")

const imageController = {}

/* ***************************
 *  Ensure backward compatibility with original inventory images
 * ************************** */
imageController.ensureBackwardCompatibility = async function (inventory_id) {
  try {
    // First check if this inventory item already has any images in the new table
    const existingImages = await imageModel.getImagesByInventoryId(inventory_id)
    
    if (!existingImages || existingImages.length === 0) {
      // Get the original inventory data
      const vehicle = await invModel.getInventoryByInventoryId(inventory_id)
      
      if (vehicle && vehicle.inv_image) {
        // Add the original image to the inventory_images table
        await imageModel.addImage(
          inventory_id, 
          vehicle.inv_image, 
          vehicle.inv_thumbnail || vehicle.inv_image, 
          true // Still use primary flag for database consistency
        )
        console.log(`Migrated original image for inventory ID ${inventory_id} to inventory_images table`)
      }
    }
    
    return true
  } catch (error) {
    console.error("Error ensuring backward compatibility:", error)
    return false
  }
}

/* ***************************
 *  Get images for specific inventory
 * ************************** */
imageController.getImages = async function (req, res, next) {
  try {
    const inventory_id = req.params.inventoryId
    
    // First ensure backward compatibility by migrating original image if needed
    await imageController.ensureBackwardCompatibility(inventory_id)
    
    // Then retrieve all images (including the potentially migrated one)
    const images = await imageModel.getImagesByInventoryId(inventory_id)
    
    res.status(200).json({ images })
  } catch (error) {
    console.error("Error getting images:", error)
    res.status(500).json({ 
      message: "Error fetching images", 
      error: error.message 
    })
  }
}

/* ***************************
 *  Build add image view
 * ************************** */
imageController.buildAddImage = async function (req, res, next) {
  try {
    const inventory_id = req.params.inventoryId
    const vehicle = await invModel.getInventoryByInventoryId(inventory_id)
    
    // Ensure backward compatibility before loading the page
    await imageController.ensureBackwardCompatibility(inventory_id)
    
    const images = await imageModel.getImagesByInventoryId(inventory_id)
    
    if (!vehicle) {
      req.flash("notice", "Vehicle not found")
      return res.redirect("/inv")
    }
    
    let nav = await utilities.getNav()
    const title = `Add Images for ${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`
    
    res.render("./inventory/add-image", {
      title,
      nav,
      vehicle,
      images,
      errors: null,
      footer: true
    })
  } catch (error) {
    console.error("Error in buildAddImage:", error)
    next(error)
  }
}

/* ***************************
 *  Process image upload
 * ************************** */
imageController.uploadImage = async function (req, res, next) {
  try {
    const inventory_id = req.body.inventory_id
    console.log("Processing image upload for inventory ID:", inventory_id)
    
    // The file has already been validated by the middleware
    console.log("File passed validation:", req.file)
    
    // Create the image path for the database
    const image_path = `/images/vehicles/${req.file.filename}`
    
    console.log("Adding image to database:", {
      inventory_id,
      image_path
    })
    
    try {
      // First update the main inventory table with the new image
      await invModel.updateInventoryImage(inventory_id, image_path)
      console.log("Updated main inventory table with new image")
      
      // Then update or add to the inventory_images table
      // First check if there are existing images for this inventory
      const existingImages = await imageModel.getImagesByInventoryId(inventory_id)
      
      if (existingImages && existingImages.length > 0) {
        // Delete existing images from the database
        for (const image of existingImages) {
          await imageModel.deleteImage(image.image_id)
          
          // Also delete the image file if it's not the same as the current inventory image
          // and if it's not a default image
          if (!image.image_path.includes('no-image')) {
            try {
              const filename = path.basename(image.image_path)
              const filePath = path.join(__dirname, "../public/images/vehicles", filename)
              
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
                console.log(`Deleted old image file: ${filename}`)
              }
            } catch (unlinkError) {
              console.error("Error deleting old image file:", unlinkError)
            }
          }
        }
      }
      
      // Add the new image to the inventory_images table
      await imageModel.addImage(
        inventory_id, 
        image_path, 
        image_path, 
        true // Always primary since it's the only image
      )
      
      req.flash("success", "Vehicle image updated successfully")
      return res.redirect(`/inv/images/${inventory_id}`)
    } catch (dbError) {
      console.error("Database error when updating image:", dbError)
      
      // Delete the uploaded file as we couldn't add it to the database
      try {
        fs.unlinkSync(path.join(__dirname, '../public', image_path))
        console.log("Deleted file due to database error:", image_path)
      } catch (unlinkError) {
        console.error("Error deleting file after database error:", unlinkError)
      }
      
      req.flash("notice", `Error updating image: ${dbError.message}`)
      return res.redirect(`/inv/images/${inventory_id}`)
    }
    
  } catch (error) {
    console.error("Error in uploadImage:", error)
    
    // If we have a file but encountered an error, try to clean it up
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path)
        console.log("Cleaned up file after error:", req.file.path)
      } catch (unlinkError) {
        console.error("Error cleaning up file:", unlinkError)
      }
    }
    
    req.flash("notice", `An unexpected error occurred: ${error.message}`)
    
    if (req.body && req.body.inventory_id) {
      return res.redirect(`/inv/images/${req.body.inventory_id}`)
    } else {
      return res.redirect("/inv")
    }
  }
}

/* ***************************
 *  Process set primary image
 * ************************** */
imageController.setPrimaryImage = async function (req, res, next) {
  try {
    const { image_id, inventory_id } = req.body
    
    // Set as primary image
    const updatedImage = await imageModel.setPrimaryImage(image_id)
    
    // Also update the main inventory table with this image
    if (updatedImage && updatedImage.image_path) {
      console.log("Updating main inventory table with new primary image:", updatedImage.image_path)
      await invModel.updateInventoryImage(inventory_id, updatedImage.image_path)
    }
    
    req.flash("success", "Primary image set successfully")
    res.redirect(`/inv/images/${inventory_id}`)
  } catch (error) {
    console.error("Error setting primary image:", error)
    req.flash("notice", "An error occurred while setting the primary image")
    res.redirect(`/inv/images/${req.body.inventory_id}`)
  }
}

/* ***************************
 *  Process delete image
 * ************************** */
imageController.deleteImage = async function (req, res, next) {
  try {
    const { image_id, inventory_id, image_path } = req.body
    
    // Check if this is a primary image before deleting
    const imageData = await imageModel.getImagesByInventoryId(inventory_id)
    const isDeleting = imageData.find(img => img.image_id == image_id && img.primary_image)
    
    // Delete image from database
    await imageModel.deleteImage(image_id)
    
    // Delete image file from server
    // Extract filename from path and build full server path
    const filename = path.basename(image_path)
    const filePath = path.join(__dirname, "../public/images/vehicles", filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    // If we deleted a primary image, set a new primary and update the main inventory
    if (isDeleting) {
      // Get remaining images
      const remainingImages = await imageModel.getImagesByInventoryId(inventory_id)
      
      if (remainingImages && remainingImages.length > 0) {
        // Set the first remaining image as primary
        const newPrimaryImage = await imageModel.setPrimaryImage(remainingImages[0].image_id)
        
        // Update the main inventory table
        await invModel.updateInventoryImage(inventory_id, newPrimaryImage.image_path)
      } else {
        // No images left, set a default image in the inventory table
        await invModel.updateInventoryImage(inventory_id, '/images/vehicles/no-image.png')
      }
    }
    
    req.flash("success", "Image deleted successfully")
    res.redirect(`/inv/images/${inventory_id}`)
  } catch (error) {
    console.error("Error deleting image:", error)
    req.flash("notice", "An error occurred while deleting the image")
    res.redirect(`/inv/images/${req.body.inventory_id}`)
  }
}

/* ***************************
 *  Migrate all inventory images to the new system (Admin tool)
 * ************************** */
imageController.migrateAllInventoryImages = async function (req, res, next) {
  try {
    // Only allow access to Admin users
    if (!res.locals.accountData || res.locals.accountData.account_type !== 'Admin') {
      req.flash("notice", "You don't have permission to perform this action")
      return res.redirect("/inv")
    }

    // Get all inventory items
    const inventoryData = await invModel.getAllInventory()
    
    let successCount = 0
    let errorCount = 0
    
    // Process each inventory item
    for (const item of inventoryData) {
      try {
        // Check if this inventory already has images in the new table
        const existingImages = await imageModel.getImagesByInventoryId(item.inv_id)
        
        // If no images exist in the new table, migrate the original image
        if (!existingImages || existingImages.length === 0) {
          if (item.inv_image) {
            // Add the original image to the inventory_images table as a primary image
            await imageModel.addImage(
              item.inv_id, 
              item.inv_image, 
              item.inv_thumbnail || item.inv_image, 
              true // Set as primary
            )
            successCount++
          }
        }
      } catch (error) {
        console.error(`Error migrating image for inventory ID ${item.inv_id}:`, error)
        errorCount++
      }
    }
    
    // Provide feedback
    if (errorCount === 0) {
      req.flash("success", `Successfully migrated ${successCount} inventory images to the new system.`)
    } else {
      req.flash("notice", `Migration completed with ${successCount} successful migrations and ${errorCount} errors.`)
    }
    
    // Redirect back to inventory management
    res.redirect("/inv")
  } catch (error) {
    console.error("Error in migrateAllInventoryImages:", error)
    req.flash("notice", "An error occurred during image migration")
    res.redirect("/inv")
  }
}

module.exports = imageController 