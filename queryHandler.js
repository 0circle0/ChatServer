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

const connect = () => {
    // Connect to the database when the application starts
    pool.connect().catch((err) => {
        console.error('Database connection failed:', err.message);
    });
}

const closePools = async () => {
    try {
        await pool.close();
    } catch (err) {
        console.error('Error closing connection pool:', err.message);
    }
};

/** @param {string} query */
const executeQuery = async (query) => {
    if (query.includes('$')) {
        return null
    };
    try {
        const request = pool.request();
        const { recordset } = await request.query(query);
        return recordset;
    } catch (err) {
        throw err;
    }
};

module.exports = { executeQuery, closePools, connect };
