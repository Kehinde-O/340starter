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

/* **********************
 *   Return account data using account id
 * ********************* */
async function getAccountById(account_id) {
    try {
        const sql = "SELECT * FROM account WHERE account_id = $1"
        const result = await pool.query(sql, [account_id])
        return result.rows[0]
    } catch (error) {
        console.error("getAccountById error: " + error)
        return null
    }
}

/* **********************
 *   Update account information
 * ********************* */
async function updateAccount(account_id, account_firstname, account_lastname, account_email) {
    try {
        const sql = "UPDATE account SET account_firstname = $1, account_lastname = $2, account_email = $3 WHERE account_id = $4 RETURNING *"
        const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_id])
        return result.rows[0]
    } catch (error) {
        console.error("updateAccount error: " + error)
        return null
    }
}

/* **********************
 *   Update account password
 * ********************* */
async function updatePassword(account_id, account_password) {
    try {
        // Hash the password before storing
        const hashedPassword = await hashPassword(account_password)
        
        const sql = "UPDATE account SET account_password = $1 WHERE account_id = $2 RETURNING *"
        const result = await pool.query(sql, [hashedPassword, account_id])
        return result.rows[0]
    } catch (error) {
        console.error("updatePassword error: " + error)
        return null
    }
}

module.exports = { 
    registerAccount, 
    checkExistingEmail, 
    getAccountByEmail,
    getAccountById,
    updateAccount,
    updatePassword
} 