const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: [true, "Please enter a unique email!"],
        lowercase: true
    },
    phone: {
        type: String
    },
    password: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('users',  userSchema);
