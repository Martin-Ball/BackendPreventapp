const { db } = require('./connection.js')

const dbConnection = async() => {

    try {
        await db.authenticate();
        console.log('Connection has been established successfully.');
        return db;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
}

module.exports = {
    dbConnection
}