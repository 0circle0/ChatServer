require('dotenv').config();
const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustedConnection: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const pool = new sql.ConnectionPool(config);

/** @param {string} query */
const executeQuery = async (query) => {
    if (query.includes('$'))
        return null;
    try {
        await pool.connect();

        const request = pool.request();
        const { recordset } = await request.query(query);
        return recordset;
    } catch (err) {
        throw err;
    } finally {
        pool.close();
    }
}

module.exports = executeQuery;