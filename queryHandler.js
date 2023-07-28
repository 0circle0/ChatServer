require('dotenv').config();
const { ConnectionPool } = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustedConnection: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 1000,
    },
};

const pool = new ConnectionPool(config);

const connect = async () => {
    // Connect to the database when the application starts
    await pool.connect();
}

const closePools = async () => {
    try {
        await pool.close();
    } catch (err) {
        console.error('Error closing connection pool:', err.message);
    }
};

/** 
 * @param {string} query
 * @param {Object} parameters
 */
const executeQuery = async (query, parameters) => {
    if (query.includes('$')) {
        return null;
    }

    try {
        const request = pool.request();

        if (parameters) {
            Object.keys(parameters).forEach((paramName) => {
                request.input(paramName, parameters[paramName]);
            });
        }

        const { recordset } = await request.query(query);
        return recordset;
    } catch (err) {
        throw err;
    }
};


module.exports = { executeQuery, closePools, connect, pool };
