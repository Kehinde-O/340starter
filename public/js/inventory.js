'use strict' 
 
// Get a list of items in inventory based on the classification_id 
document.addEventListener('DOMContentLoaded', function() {
  // Try different potential selectors for the classification list
  let classificationList = document.querySelector("#classificationList")
  if (!classificationList) {
    classificationList = document.querySelector(".classification-selection select")
  }

  // Only add event listener if the element exists
  if (classificationList) {
    classificationList.addEventListener("change", function () { 
      let classification_id = classificationList.value 
      console.log(`classification_id is: ${classification_id}`) 
      let classIdURL = "/inv/getInventory/"+classification_id 
      fetch(classIdURL) 
      .then(function (response) { 
        if (response.ok) { 
          return response.json(); 
        } 
        throw Error("Network response was not OK"); 
      }) 
      .then(function (data) { 
        console.log(data); 
        buildInventoryList(data); 
      }) 
      .catch(function (error) { 
        console.log('There was a problem: ', error.message) 
      }) 
    })
  } else {
    console.log('Classification list select element not found in the page')
  }
})

// Build inventory items into HTML table components and inject into DOM 
function buildInventoryList(data) { 
  let inventoryDisplay = document.getElementById("inventoryDisplay"); 
  if (!inventoryDisplay) {
    console.log('Inventory display element not found')
    return
  }
  
  // Set up the table labels 
  let dataTable = '<thead>'; 
  dataTable += '<tr><th>Vehicle Name</th><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'; 
  dataTable += '</thead>'; 
  // Set up the table body 
  dataTable += '<tbody>'; 
  
  if (data && data.length > 0) {
    // Iterate over all vehicles in the array and put each in a row 
    data.forEach(function (element) { 
      console.log(element.inv_id + ", " + element.inv_model); 
      dataTable += `<tr><td>${element.inv_make} ${element.inv_model}</td>`; 
      dataTable += `<td><a href='/inv/edit/${element.inv_id}' title='Click to update'>Modify</a></td>`; 
      dataTable += `<td><a href='/inv/delete/${element.inv_id}' title='Click to delete'>Delete</a></td>`;
      dataTable += `<td><a href='/inv/images/${element.inv_id}' title='Click to manage images'>Images</a></td></tr>`; 
    })
  } else {
    dataTable += '<tr><td colspan="4">No inventory items found</td></tr>';
  }
  
  dataTable += '</tbody>'; 
  // Display the contents in the Inventory Management view 
  inventoryDisplay.innerHTML = dataTable; 
} 