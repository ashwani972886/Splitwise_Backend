const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    type: {
        type: String,
        enum: ["Group", "Friend"]
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups'
    },
    desc: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ""
    },
    date: {
        type: Date
    },
    split_method: {
        type: String,
        required: true,
        enum: ['equally', 'amounts', 'percentages', 'shares']
    },
    split_between: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'users'
            },
            paid: {
                type: Number
            },
            share: {
                type: Number
            }
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('expenses', expenseSchema);