const db = require('../models/index');

module.exports = () => {
    db.mongoose.connection.on('connected',  connected => {  
    console.log('Splitwise database successfully connected!');
    });
    db.mongoose.connection.on('error', err => {
        console.log('Unable to connect to mongo! Please try again!');
    });
};