const mongoose = require('mongoose');
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

 mongoose.connect(`mongodb://${dbHost}:${dbPort}/${dbName}`);
 
const db = {};

db.mongoose = mongoose;

// Databases
// db.user = require('./user')(mongoose);


module.exports = db;