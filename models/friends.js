const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    added_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    friend: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        },
    balances: {
        owe: {
            type: Number,
            default: 0
        },
        owed: {
            type: Number,
            default: 0
        }
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('friends',  friendSchema);
