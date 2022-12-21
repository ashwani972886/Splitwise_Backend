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

exports.addExpense = asyncMiddleware(async(req, res) => {
    const userId = req.user;
    const body = {...req.body};
    
    // let splitData = (body.split_between).sort((data1, data2) => (data1.paid < data2.paid) ? 1 : (data1.paid > data2.paid) ? -1 : 0);

    // let splitData= (body.split_between).sort((data1, data2) => ((data1.paid - data1.share) > 0) ? 1 : ((data1.paid - data1.share) > 0) ? -1 : 0);
    let splitData = (body.split_between).sort((data1, data2) => {return (data2.paid - data2.share) - (data1.paid - data1.share)});
    // console.log(splitData);
    
    if(splitData[0].paid === body.amount) {
        const paidUser = new ObjectId(splitData[0].user);
        const paidAmount = splitData[0].paid;
        const userShareAmount = splitData[0].share;
        const balAmount = paidAmount - userShareAmount;
        const restArray = splitData.slice(1, splitData.length);

        const sharePerHead = balAmount / restArray.length;
        for(let i = 0; i < restArray.length; i++) {
            const splitUser = new ObjectId(restArray[i].user);
            
            let updateBal = null;

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
                const {owe, owed} = friendship.balances;
                if(friendship.added_by.equals(paidUser)) {
                    if(owe === 0) {
                        updateBal = await Friend.findOneAndUpdate(query_filter, {
                            $inc: {
                                "balances.owed": sharePerHead
                            }
                        });
                    } else {
                        const diff = sharePerHead - owe;
                        if(diff >= 0 ) {
                            updateBal = await Friend.findOneAndUpdate(query_filter, {
                                $inc: {
                                    "balances.owe": -owe,
                                    "balances.owed": diff
                                }
                            });
                        } else {
                            updateBal = await Friend.findOneAndUpdate(query_filter, {
                                $inc: {
                                    "balances.owe": -sharePerHead,
                                }
                            });
                        }
                    }
                } else {
                    if(owed === 0 ){
                        updateBal = await Friend.findOneAndUpdate(query_filter, {
                            $inc: {
                                "balances.owe": sharePerHead
                            }
                        });
                    } else {
                        const diff = sharePerHead - owed;
                        if(diff >= 0 ) {
                            updateBal = await Friend.findOneAndUpdate(query_filter, {
                                $inc: {
                                    "balances.owe": diff,
                                    "balances.owed": -owed
                                }
                            });
                        } else {
                            updateBal = await Friend.findOneAndUpdate(query_filter, {
                                $inc: {
                                    "balances.owed": -sharePerHead,
                                }
                            });
                        }
                    }
                }
                res.send(updateBal);
            }

        }
    } else {
        let updateBal = null;
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
                    console.log(splitData[j]);
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
                        const {owe, owed} = friendship.balances;
                        if(friendship.added_by.equals(paidUser)) {
                            if(owe === 0) {
                                updateBal = await Friend.findOneAndUpdate(query_filter, {
                                    $inc: {
                                        "balances.owed": balAmount
                                    }
                                });
                            } else {
                                const finalDiff = balAmount - owe;
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
                                            "balances.owe": -balAmount,
                                        }
                                    });
                                }
                            }
                        } else {
                            if(owed === 0) {
                                updateBal = await Friend.findOneAndUpdate(query_filter, {
                                    $inc: {
                                        "balances.owe": balAmount
                                    }
                                });
                            } else {
                                const finalDiff = balAmount - owed;
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
                                            "balances.owed": -balAmount,
                                        }
                                    });
                                }
                            }
                        }
                        balAmount = 0;
                        break;
                    }
                    break;
                } else {
                    splitData[j].share -= splitUserShareAmount;

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
                        const {owe, owed} = friendship.balances;
                        if(friendship.added_by.equals(paidUser)) {
                            if(owe === 0) {
                                updateBal = await Friend.findOneAndUpdate(query_filter, {
                                    $inc: {
                                        "balances.owed": splitUserShareAmount
                                    }
                                });
                            } else {
                                const finalDiff = splitUserShareAmount - owe;
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
                                            "balances.owe": -splitUserShareAmount,
                                        }
                                    });
                                }
                            }
                        } else {
                            if(owed === 0) {
                                updateBal = await Friend.findOneAndUpdate(query_filter, {
                                    $inc: {
                                        "balances.owe": splitUserShareAmount
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
                                            "balances.owed": -splitUserShareAmount,
                                        }
                                    });
                                }
                            }
                        }
                    }
                    balAmount = 0;
                    break;

                    j++;
                }

            }

        }
        res.send(updateBal);
    }

    const UpdateBalances = async() => {

    };

    // console.log(body);
    // const expenseAmount = body.amount;

    // for(let i = 0; i < body.paid_by.length; i++) {
    //     const paidAmount = body.paid_by[i].amount;
    //     const sharePerHead = (paidAmount)/(body.split_between.length);

    // }

    // if(body.paid_by.length === 1) {
    //     const paidUser = new ObjectId(body.paid_by[0].user);
    //     for(let i = 0; i < body.split_between.length; i++) {
    //         const splitUser = new ObjectId(body.split_between[i].user);

    //         if(splitUser.equals(paidUser)) {
    //             continue;
    //         }

    //         const query_filter = {
    //             $or: [
    //                 {
    //                     $and: [
    //                         {admin: paidUser},
    //                         {friend: splitUser}
    //                     ]
    //                 },
    //                 {
    //                     $and: [
    //                         {admin: splitUser},
    //                         {friend: paidUser}
    //                     ]
    //                 }
    //             ]
    //         };

    //         const friendship = await Friend.findOne(query_filter);

    //         if(friendship) {
    //             const {owe, owed} = friendship.balances;
    //             if(friendship.added_by.equals(paidUser)) {
    //                 if(owe == 0) {
    //                     const updateBal = await Friend.findOneAndUpdate(query_filter, {
    //                         $inc: {
    //                             "balances.owed": sharePerHead
    //                         }
    //                     });
    //                     res.send(updateBal);

    //                 } else {
    //                     const diff = sharePerHead - owe;
    //                     if(diff >= 0){
    //                         const updateBal = await Friend.findOneAndUpdate(query_filter, {
    //                             $inc: {
    //                                 "balances.owe": -owe,
    //                                 "balances.owed": diff
    //                             }
    //                         });
    //                         res.send(updateBal);

    //                     } else {
    //                         const updateBal = await Friend.findOneAndUpdate(query_filter, {
    //                             $inc: {
    //                                 "balances.owe": -sharePerHead
    //                             }
    //                         });
    //                         res.send(updateBal);
    //                     }
    //                 }
    //             } else {
    //                 if(owed == 0) {
    //                     const updateBal = await Friend.findOneAndUpdate(query_filter, {
    //                         $inc: {
    //                             "balances.owe": sharePerHead
    //                         }
    //                     });
    //                     res.send(updateBal);

    //                 } else {
    //                     const diff = sharePerHead - owed;
    //                     if(diff >= 0){
    //                         const updateBal = await Friend.findOneAndUpdate(query_filter, {
    //                             $inc: {
    //                                 "balances.owe": diff,
    //                                 "balances.owed": -owed
    //                             }
    //                         });
    //                         res.send(updateBal);

    //                     } else {
    //                         const updateBal = await Friend.findOneAndUpdate(query_filter, {
    //                             $inc: {
    //                                 "balances.owed": -sharePerHead
    //                             }
    //                         });
    //                         res.send(updateBal);
    //                     }
    //                 }
    //             }
    //         }

    //     }
    // }

    // res.send({expenseAmount, sharePerHead});
});