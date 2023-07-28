const queryHandler = require('./queryHandler');
const mssql = require('mssql');
console.error = jest.fn();
jest.mock('mssql', () => {
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
    const mssql = jest.requireActual('mssql');
    const { ConnectionPool } = mssql;
    return {
        ...mssql,
        ConnectionPool: jest.fn().mockImplementation(() => {
            const pool = new ConnectionPool(config);
            pool.connect = jest.fn().mockResolvedValue(true);
            pool.close = jest.fn().mockResolvedValue(true);
            pool.request = jest.fn().mockImplementation(() => {
                const request = new mssql.Request();
                request.query = jest.fn().mockResolvedValue({recordset: true});
                return request;
            });
            return pool;
        }
        ),
    };
});

test('connect to database', () => {
    queryHandler.connect();
    expect(queryHandler.pool.connect).toHaveBeenCalledTimes(1);
});

test('close database connection', async () => {
    await queryHandler.closePools();
    expect(queryHandler.pool.close).toHaveBeenCalledTimes(1);
    expect(console.error).not.toHaveBeenCalled();
});

test('close database connection with error', async () => {
    queryHandler.pool.close = jest.fn().mockRejectedValueOnce(new Error('error'));
    await queryHandler.closePools();
    expect(queryHandler.pool.close).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Error closing connection pool:', 'error');
});

test('execute query returns null due to $ in query', async () => {
    const query = '$query';
    const returnValue = await queryHandler.executeQuery(query);
    expect(returnValue).toBe(null);
});

test('execute query succeeds', async () => {
    const query = 'SELECT * FROM Person';
    const returnValue = await queryHandler.executeQuery(query);
    expect(returnValue).toBe(true);
});

test('execute query succeeds with parameters', async () => {
    const query = 'SELECT * FROM Person WHERE id = @id';
    const returnValue = await queryHandler.executeQuery(query, {id: 1});
    expect(returnValue).toBe(true);
});

test('execute query fails and throws error', async () => {
    const query = 'SELECT * FROM Person';
    queryHandler.pool.request = jest.fn().mockImplementation(() => {
        const request = new mssql.Request();
        request.query = jest.fn().mockRejectedValueOnce(new Error('error'));
        return request;
    });
    await expect(queryHandler.executeQuery(query)).rejects.toThrow('error');
});