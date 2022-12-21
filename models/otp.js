const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    otp: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('otp',  otpSchema);
