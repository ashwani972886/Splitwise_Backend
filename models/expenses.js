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
    paid_by: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'users'
            },
            amount: {
                type: Number
            }
        }
    ],
    split_between: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'users'
            },
            share: {
                type: Number
            }
        }
    ],
    created_at: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('expenses', expenseSchema);