const { MongoClient } = require('mongodb');

let connection;
let database;

async function initDatabase() {
    connection = await MongoClient.connect(process.env.MONGO_URL);
    database = connection.db(process.env.MONGO_DB);
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