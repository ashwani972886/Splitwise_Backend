// Functions
const fun = require('../init/function');
const email = require('../init/sendEmail');
// Packages required
const {ObjectId} = require('mongodb');
// Secrets from .env


// Try-catch middleware
const asyncMiddleware = require('../middlewares/async');

// Models
const User = require('../models/user');
const Group = require('../models/groups');
const Friend = require('../models/friends');
const Expense = require('../models/expenses');

exports.addExpense = asyncMiddleware(async(req, res) => {

    const UpdateBalances = async(paidUser, splitUser, newBal) => {
        const query_filter = {
            $or: [
                {
                    $and: [
                        {added_by: paidUser},
                        {friend: splitUser}
                    ]
                },
                {
                    $and: [
                        {added_by: splitUser},
                        {friend: paidUser}
                    ]
                }
            ]
        };

        const friendship = await Friend.findOne(query_filter);

        if(friendship) {
            let updateBal = null;
            const {owe, owed} = friendship.balances;
            if(friendship.added_by.equals(paidUser)) {
                if(owe === 0) {
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owed": newBal
                        }
                    });
                } else {
                    const finalDiff = newBal - owe;
                    if(finalDiff >= 0) {
                        updateBal = await Friend.findOneAndUpdate(query_filter, {
                            $inc: {
                                "balances.owe": -owe,
                                "balances.owed": finalDiff
                            }
                        });
                    } else {
                        updateBal = await Friend.findOneAndUpdate(query_filter, {
                            $inc: {
                                "balances.owe": -newBal,
                            }
                        });
                    }
                }
            } else {
                if(owed === 0) {
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owe": newBal
                        }
                    });
                } else {
                    const finalDiff = splitUserShareAmount - owed;
                    if(finalDiff >= 0 ) {
                        updateBal = await Friend.findOneAndUpdate(query_filter, {
                            $inc: {
                                "balances.owe": finalDiff,
                                "balances.owed": -owed
                            }
                        });
                    } else {
                        updateBal = await Friend.findOneAndUpdate(query_filter, {
                            $inc: {
                                "balances.owed": -newBal,
                            }
                        });
                    }
                }
            }
        }
    };

    const userId = req.user;
    const body = {...req.body};

    const splitUsers = (body.split_between).slice(0);

    const splitData = (splitUsers).sort((data1, data2) => {return (data2.paid - data2.share) - (data1.paid - data1.share)});
    
    if(splitData[0].paid === body.amount) {
        const paidUser = new ObjectId(splitData[0].user);
        const paidAmount = splitData[0].paid;
        const userShareAmount = splitData[0].share;
        const balAmount = paidAmount - userShareAmount;
        const restArray = splitData.slice(1, splitData.length);

        const sharePerHead = balAmount / restArray.length;
        for(let i = 0; i < restArray.length; i++) {
            const splitUser = new ObjectId(restArray[i].user);

            await UpdateBalances(paidUser, splitUser, sharePerHead);
        }
    } else {

        for(let i = 0; i < splitData.length; i++) {
            const paidUser = new ObjectId(splitData[i].user);
            const paidAmount = splitData[i].paid;
            const userShareAmount = splitData[i].share;
            let balAmount = paidAmount - userShareAmount;

            if(balAmount === 0) {
                continue;
            }

            for(let j = i+1; j < splitData.length; j++) {
                const splitUser = new ObjectId(splitData[j].user);
                const splitUserPaidAmount = splitData[j].paid;
                const splitUserShareAmount = splitData[j].share;
                const splitUserBalAmount = splitUserPaidAmount - splitUserShareAmount;

                if(splitUserBalAmount >= 0 || splitUserShareAmount === 0) {
                    continue;
                }

                const diff = balAmount - splitUserShareAmount;

                if(diff <= 0){
                    splitData[j].share -= balAmount;
                    
                    await UpdateBalances(paidUser, splitUser, balAmount);
                    balAmount = 0;
                    break;
                    
                } else {
                    splitData[j].share -= splitUserShareAmount;

                    // Call Function here
                    await UpdateBalances(paidUser, splitUser, splitUserShareAmount);
                    balAmount -= splitUserShareAmount;
                    j++;

                }

            }

        }
    }

    body.createdBy = userId;
    const newExpense = new Expense(body);
    const saveNewExpense = await newExpense.save();

    if(!saveNewExpense) {
        return res.status(500).send({error: "Internal server error!"});
    } else {
        return res.status(201).send({message: "Expense created successfully!"});
    }

});