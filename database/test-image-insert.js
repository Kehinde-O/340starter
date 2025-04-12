const pool = require("./")

async function testImageInsert() {
  try {
    console.log("Testing inserting an image record directly into the database...")
    
    // Insert a test record
    const insertSQL = `
      INSERT INTO inventory_images 
      (inventory_id, image_path, thumbnail_path, primary_image) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `
    
    const testResult = await pool.query(
      insertSQL, 
      [1, '/images/vehicles/test-image.jpg', '/images/vehicles/test-image.jpg', false]
    )
    
    console.log("Test record inserted successfully:", testResult.rows[0])
    
    // Clean up the test record
    await pool.query(
      "DELETE FROM inventory_images WHERE image_path = $1", 
      ['/images/vehicles/test-image.jpg']
    )
    
    console.log("Test record cleaned up")
    console.log("Database insert test completed successfully!")
    
    return true
  } catch (error) {
    console.error("Error testing image insert:", error)
    return false
  }
}

// Run when script is executed directly
if (require.main === module) {
  testImageInsert()
    .then(success => {
      console.log("Test complete, success:", success)
      process.exit(success ? 0 : 1)
    })
    .catch(err => {
      console.error("Test error:", err)
      process.exit(1)
    })
}

module.exports = { testImageInsert } 