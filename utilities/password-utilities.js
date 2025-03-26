const bcrypt = require("bcryptjs")

/* *****************************
*   Hash password
* *************************** */
function hashPassword(password) {
    return bcrypt.hashSync(password, 10)
}

/* *****************************
*   Compare password
* *************************** */
function comparePassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword)
}

module.exports = { hashPassword, comparePassword } 