const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    type: {
        type: String,
        enum: ["Group", "Friend"]
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
        type: String
    },
    date: {
        type: Date,
        default: Date.now()
    },
    split_method: {
        type: String,
        required: true,
        enum: ['equally', 'exact_amounts', 'pecentage', 'share', 'adjustment', 'reimbursment', 'itemised']
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