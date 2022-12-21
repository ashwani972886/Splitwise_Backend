const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    groupName: {
        type: String,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users'
        }
    ],
    groupType: {
        type: String,
        enum: ["Home", "Trip", "Couple", "Other"]
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('groups',  groupSchema);
