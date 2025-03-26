const pool = require("../database/")
const { hashPassword } = require("../utilities/password-utilities")

/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
    try {
        // Hash the password before storing
        const hashedPassword = await hashPassword(account_password)
        
        const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *"
        return await pool.query(sql, [account_firstname, account_lastname, account_email, hashedPassword])
    } catch (error) {
        return error.message
    }
}

/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email){
    try {
        const sql = "SELECT * FROM account WHERE account_email = $1"
        const email = await pool.query(sql, [account_email])
        return email.rowCount
    } catch (error) {
        return error.message
    }
}

/* **********************
 *   Return account data using email address
 * ********************* */
async function getAccountByEmail(account_email) {
    try {
        const sql = "SELECT * FROM account WHERE account_email = $1"
        const result = await pool.query(sql, [account_email])
        return result.rows[0]
    } catch (error) {
        console.error("getAccountByEmail error: " + error)
        return null
    }
}

module.exports = { registerAccount, checkExistingEmail, getAccountByEmail } 