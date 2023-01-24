const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    settleWithin: {
        type: String,
        required: true,
        enum: ["Individual", "Group"]
    },
    notes: {
        type: String,
        default: ""
    },
    amount: {
        type: Number,
        required: true
    },
    settlementDate: {
        type: Date
    },
    payee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('settlements', settlementSchema);