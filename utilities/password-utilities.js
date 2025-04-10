const bcrypt = require("bcryptjs")

/* *****************************
*   Hash password
* *************************** */
async function hashPassword(password) {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.log("Error in hashPassword function");
        throw error;
    }
}

/* *****************************
*   Compare password
* *************************** */
async function comparePassword(password, hashedPassword) {
    try {
        return await bcrypt.compare(password, hashedPassword)
    } catch (error) {
        throw new Error("Access Forbidden");
    }
}

module.exports = { hashPassword, comparePassword } 