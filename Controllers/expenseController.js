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
const SettleExpense = require('../models/settlement');

const UpdateBalances = async(paidUser, splitUser, newBal) => {
    // Query filter to find if two users have some friendship
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

    // Find if both users have friendship
    const friendship = await Friend.findOne(query_filter);

    if(friendship) {
        let updateBal = null;
        const {owe, owed} = friendship.balances; // Taking out balances from database
        if(friendship.added_by.equals(paidUser)) { //Checking if the user who paid has added another user as a friend
            if(owe === 0) {
                // If the user who paid doesn't owe any amount
                updateBal = await Friend.findOneAndUpdate(query_filter, {
                    $inc: {
                        "balances.owed": newBal
                    }
                });
            } else {
                // If the user who paid owe some amount
                const finalDiff = newBal - owe;
                if(finalDiff >= 0) {
                    // If the paying user has more or zero balance to pay than owe balance
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owe": -owe,
                            "balances.owed": finalDiff
                        }
                    });
                } else {
                    // If the paying user has less balance to pay than owe balance
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owe": -newBal,
                        }
                    });
                }
            }
        } else { // Checking if the user who paid is added as a friend by another user
            if(owed === 0) {
                // If the user who paid doesn't owe any amount
                updateBal = await Friend.findOneAndUpdate(query_filter, {
                    $inc: {
                        "balances.owe": newBal
                    }
                });
            } else {
                const finalDiff = newBal - owed;
                if(finalDiff >= 0 ) {
                    // If the paying user has more or zero balance to pay than owe balance
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owe": finalDiff,
                            "balances.owed": -owed
                        }
                    });
                } else {
                    // If the paying user has less balance to pay than owe balance
                    updateBal = await Friend.findOneAndUpdate(query_filter, {
                        $inc: {
                            "balances.owed": -newBal,
                        }
                    });
                }
            }
        }
    } else {
        return false;
    }
};

const updateExpense = async(data, type) => {

    if(type === "delete") {
        // In case of deleting expense, we will interchange paid and share amount
        for(let i = 0; i < data.split_between.length; i++) {
            // let {paid, share} = expense.split_between[i];
            [data.split_between[i].paid, data.split_between[i].share] = [data.split_between[i].share, data.split_between[i].paid];
        }
    }

    // Making a deep copy of passed data
    const splitUsers = (JSON.parse(JSON.stringify(data.split_between)));

    // Sorting the data in decreasing order as per paid amount
    const splitData = (splitUsers).sort((data1, data2) => {return (data2.paid - data2.share) - (data1.paid - data1.share)});

    if(splitData[0].paid === data.amount && data.split_method === "equally"){ // Will run if single user has paid whole amount and split equally
        const paidUser = new ObjectId(splitData[0].user); // The user who paid the amount
        const paidAmount = splitData[0].paid; // Amount paid
        const userShareAmount = splitData[0].share; // Share amount
        const balAmount = paidAmount - userShareAmount; // Bal amount after deducting self share
        const restArray = splitData.slice(1, splitData.length); // Rest users in which amount has to be splitted

        const sharePerHead = balAmount / restArray.length; // Calculating the share that needs to be distributed in between rest of the members

        for(let i = 0; i < restArray.length; i++) {
            const splitUser = new ObjectId(restArray[i].user); // The user with whom amount is being shared

            // Calling the function to update balances
            await UpdateBalances(paidUser, splitUser, sharePerHead);
        }
    } else {
    // Will run if multiple users has paid whole amount and split as per share or any other method
        for(let i = 0; i < splitData.length-1; i++) {
            const paidUser = new ObjectId(splitData[i].user); // The user who paid the amount
            const paidAmount = splitData[i].paid; // Amount paid
            const userShareAmount = splitData[i].share; // Share amount
            let balAmount = paidAmount - userShareAmount; // Bal amount after deducting self share

            if(balAmount === 0) {
                // If balAmount is 0 then it will skipped as he has no amount to share with others
                continue;
            }

            for(let j = i+1; j < splitData.length; j++) {
                const splitUser = new ObjectId(splitData[j].user); // The user with whom amount is being shared
                const splitUserPaidAmount = splitData[j].paid; // If some amount is being paid by the user
                const splitUserShareAmount = splitData[j].share; // Share amount
                const splitUserBalAmount = splitUserPaidAmount - splitUserShareAmount; // Bal amount of the user

                if(splitUserBalAmount >= 0 || splitUserShareAmount === 0) {
                    // If splitUserBalAmount is greater than or equal to 0, then it will be skipped. As this user also has no balance to splitted
                    // Also, if splitUserShareAmount is 0, then this user will be skipped
                    continue;
                }

                // Calculating if payee user has less, more or equal amount of share that given user needs
                const diff = balAmount + splitUserBalAmount; 

                if(diff <= 0){
                    // If payee has less or equal amount to share
                    splitData[j].share -= balAmount; // Will reduce the share amount of user by balAmount, so that only required amount will be considered on next loop
                    
                    // Calling the function to update balances
                    await UpdateBalances(paidUser, splitUser, balAmount);
                    // Setting the balAmount to zero as payee has shared the whole remaining amount with the user
                    balAmount = 0;
                    break;
                    
                } else {
                    splitData[j].share -= splitUserShareAmount; // Will reduce the share amount of user by splitUserShareAmount and will make it zero as payee has paid total required amount

                    // Call Function here
                    await UpdateBalances(paidUser, splitUser, -splitUserBalAmount);
                    // Subtracting the splitUserBalAmount from balAmount as this much is paid
                    balAmount += splitUserBalAmount;
                    
                }

            }

        }
    }
};

// API to add an expense
exports.addExpense = asyncMiddleware(async(req, res) => {

    const userId = req.user; // Passed from middleware after verifying token
    const body = {...req.body};

    // Calling this function will add balances accordingly
    await updateExpense(body, "add");

    body.createdBy = userId;
    // Create a new expense
    const newExpense = new Expense(body);
    const saveNewExpense = await newExpense.save();

    if(!saveNewExpense) {
        return res.status(500).send({error: "Internal server error!"});
    } else {
        return res.status(201).send({message: "Expense created successfully!"});
    }

});

// API to delete an expense
exports.deleteExpense = asyncMiddleware(async(req, res) => {

    const {expenseId} = req.params; // Expense Id from params

    const expense = await Expense.findOne({_id: expenseId});
    
    if(!expense) {
        return res.status(404).send({error: 'Expense not found! Please select a valid expense.'});
    } else {
        
        // Calling this function will remove balances accordingly
        await updateExpense(expense, "delete");

        // Delete the expense
        const isExpenseDeleted = await Expense.findByIdAndDelete({_id: expenseId});

        if(isExpenseDeleted) {
            return res.status(200).send({message: "Expense Deleted Succesfully!"});
        }

    }
    
});

// API to update an expense
exports.updateExpense = asyncMiddleware(async(req, res) => {    
    const userId = req.user; // Passed from middleware after verifying token
    const {expenseId} = req.params; // Expense Id from params
    const body = {...req.body};

    const expense = await Expense.findOne({_id: expenseId});

    if(!expense) {
        return res.status(404).send({error: 'Expense not found! Please select a valid expense.'});
    } else {
        
        // Calling this function to reverse the previously added share first
        await updateExpense(expense, "delete");

        // Then calling this function to update the new balances
        await updateExpense(body, "add");

        // Update the expense details
        const isExpenseUpdated = await Expense.findOneAndUpdate({_id: expenseId}, body);

        if(!isExpenseUpdated) {
            return res.status(500).send({error: "Internal server error!"});
        } else {
            return res.status(200).send({message: "Expense updated successfully!"});
        }

    }

});

// API to settle expense
exports.settleExpense = asyncMiddleware(async(req, res) => {
    
    const userId = req.user; // Passed from middleware after verifying token
    let {payee, receiver, amount} = req.body;

    payee = new ObjectId(payee);
    receiver = new ObjectId(receiver);

    const query_filter = {
        $or: [
            {
                $and: [
                    {added_by: payee},
                    {friend: receiver}
                ]
            },
            {
                $and: [
                    {added_by: receiver},
                    {friend: payee}
                ]
            }
        ]
    };

    const friendship = await Friend.findOne(query_filter);

    if(!friendship) {
        return res.status(404).send({error: "There are no balances to be cleared!"});
    }

    const {owe, owed} = friendship.balances;
    let updateBal = null;
    if((friendship.added_by).equals(payee)) {
        if(owe === 0) {
            return res.status(404).send({error: "There are no balances to be cleared!"});
        }

        const diff = amount - owe;
        if(diff <= 0) {
            updateBal = await Friend.findOneAndUpdate(query_filter, {
                $inc: {
                    "balances.owe": -amount
                }
            });
        } else {
            updateBal = await Friend.findOneAndUpdate(query_filter, {
                $inc: {
                    "balances.owe": -owe,
                    "balances.owed": diff
                }
            });
        }

    } else {
        if(owed === 0) {
            return res.status(404).send({error: "There are no balances to be cleared!"});
        }

        const diff = amount - owed;
        if(diff <= 0) {
            updateBal = await Friend.findOneAndUpdate(query_filter, {
                $inc: {
                    "balances.owed": -amount
                }
            });
        } else {
            updateBal = await Friend.findOneAndUpdate(query_filter, {
                $inc: {
                    "balances.owe": diff,
                    "balances.owed": -owed
                }
            });
        }
    }

    if(updateBal) {
        req.body.createdBy = userId;
        const newSettlement = new SettleExpense(req.body);
        const newSettlementStatus = await newSettlement.save();
        if(newSettlementStatus) {
            return res.status(200).send({message: "Amount paid successfully!"});
        } else {
            return res.status(500).send({error: "Internal server error!"});
        }
    } else {
        return res.status(500).send({error: "Internal server error!"});
    }

});