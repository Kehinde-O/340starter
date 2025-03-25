const invModel = require("../models/inventory-model")
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
  let data = await invModel.getClassifications()
  let list = "<ul class='navigation'>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our ' +
      row.classification_name +
      ' inventory">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}

/* **************************************
* Build the vehicle detail view HTML
* ************************************ */
Util.buildVehicleDetail = async function(vehicle){
  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(vehicle.inv_price)

  let html = `
    <div class="vehicle-container">
      <h1>${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}</h1>
      
      <div class="vehicle-detail">
        <div class="vehicle-image">
          <img src="${vehicle.inv_image}" alt="Image of ${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}">
        </div>
        
        <div class="vehicle-info">
          <h2>${vehicle.inv_make} ${vehicle.inv_model} Details</h2>
          
          <div class="detail-item">
            <h3>Price:</h3>
            <p class="price">${price}</p>
          </div>
          
          <div class="detail-item description">
            <h3>Description:</h3>
            <p>${vehicle.inv_description}</p>
          </div>
          
          <div class="detail-item">
            <h3>Color:</h3>
            <p>${vehicle.inv_color}</p>
          </div>
          
          <div class="detail-item">
            <h3>Miles:</h3>
            <p>${new Intl.NumberFormat('en-US').format(vehicle.inv_miles)}</p>
          </div>
        </div>
      </div>
    </div>
  `
  return html
}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ************************
 * Build the classification view HTML
 ************************** */
Util.buildClassificationGrid = function(data) {
  let grid = '<div class="inventory-container">'
  grid += '<ul id="inv-display">'
  data.forEach(vehicle => {
    grid += '<li>'
    grid +=  '<a href="/inv/detail/' + vehicle.inv_id 
    + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 
    + ' details"><img src="' + vehicle.inv_thumbnail 
    + '" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 
    + ' on CSE Motors" /></a>'
    grid += '<div class="namePrice">'
    grid += '<hr />'
    grid += '<h2>'
    grid += '<a href="/inv/detail/' + vehicle.inv_id +'" title="View ' 
    + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 
    + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
    grid += '</h2>'
    grid += '<span>$' 
    + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
    grid += '</div>'
    grid += '</li>'
  })
  grid += '</ul>'
  grid += '</div>'
  return grid
}

module.exports = Util