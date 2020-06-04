const { MongoClient } = require('mongodb');

let connection;
let database;

async function initDatabase() {
    connection = await MongoClient.connect('mongodb://ff-backend:ff-pwd@192.168.4.99:30519/ff');
    database = connection.db('ff');
}

function getDatabase()
{
    return database;
}

function closeDatabase()
{
    connection.close();
}

module.exports = { getDatabase, initDatabase, closeDatabase };