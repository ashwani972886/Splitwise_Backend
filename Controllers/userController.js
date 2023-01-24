// Functions
const fun = require('../init/function');
const email = require('../init/sendEmail');
// Packages required
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
const ip = require('ip');
const { ObjectId } = require('mongodb');
// Secrets from .env
const jwt_secret = process.env.JWT_SECRET;

// Try-catch middleware
const asyncMiddleware = require('../middlewares/async');

// Models
const User = require('../models/user');
const OTP = require('../models/otp');
const Friend = require('../models/friends');
const Expense = require('../models/expenses');
const SettleExpense = require('../models/settlement');

// API to create user
exports.createUser = asyncMiddleware (async (req, res) => {
    const body = {...req.body};
    body.name = fun.Capitalize(body.name); // To capitalize each word of name
    const salt = await bcrypt.genSalt(10);
    const encryptPass = await bcrypt.hash(body.password, salt); //Password encryption
    body.password = encryptPass;
    const newUser = new User(body); //Create new user
    newUser.save(err => {
        if(err) {
            if(err.name == "MongoServerError" && err.code == 11000) {
                // Mongoose validation error for duplicate key
                return res.status(400).send({ error: "User already exists. Please enter a unique email!" });
            }
        } else {
            const authToken = jwt.sign({
                id: newUser._id,
            }, jwt_secret);
            return res.status(201).json({
                message: "New user created successfully!",
                result: {authToken}
            });
        }
    });
});

// API to login user
exports.loginUser = asyncMiddleware(async(req, res) => {
    const body = {...req.body};
    const user = await User.findOne({ email: body.email });
    if (user == null) {
        return res.status(404).send({ error: "Please try to login with valid credentials!" });
    } else {
        //Validate Password
        const validatePass =  await bcrypt.compare(body.password, user.password); 
        if(!validatePass) {
            return res.status(401).send({ error: "Please try to login with valid credentials!" });
        } else {
            // Signing the token
            const authToken = jwt.sign({
                id: user._id,
            }, jwt_secret, {expiresIn: '24h'});
            return res.status(200).json({
                message: "User Logged In Succesfully!",
                result: {authToken}
            });
        }
    }
});

// API to get user details
exports.getUser = asyncMiddleware(async(req, res) => {
    const userId = req.user; // Passed after verifying token
    const user = await User.findOne({ _id: userId }).select("-password");
    if (user == null) {
        return res.status(404).send({ error: "User not found with given details!" });
    } else {
        return res.status(200).json({
            message: "User details",
            result: user
        });
    }
});

// API to get friend details
exports.getFriendDetails = asyncMiddleware(async(req, res) => {
    const userId = new ObjectId(req.user);
    const friendId = new ObjectId(req.params.id);

    let monthsList = [];
    let expenseList = [];

    // Finding the details of the friend
    const friendDetails = await User.findOne({ _id: friendId }).select("-password");

    if (friendDetails == null) {
        return res.status(404).send({ error: "User not found with given details!" });
    } else {

        // Query to find expense between two friends
        const query_filter = {
            $and: [
                {type: "Friend"},
                {$and: [
                    {split_between: {$elemMatch: {user: userId}}},
                    {split_between: {$elemMatch: {user: friendId}}}
                ]}
            ]
        };

        // Finding the expenses between two friends
        const expenses = await Expense.find(query_filter).populate('split_between.user createdBy', 'name email').sort({date: -1});

        // Query to find settlements between two friends
        const query_filter2 = {
            $or: [
                {$and: [
                    {payee: userId},
                    {receiver: friendId}
                ]},
                {$and: [
                    {payee: friendId},
                    {receiver: userId}
                ]}
            ]
        };

        const settlement = await SettleExpense.find(query_filter2).populate('payee receiver createdBy', 'name email').sort({settlementDate: -1});

        // Query to find balances of two friends
        const query_filter3 = {
            $or: [
                {$and: [
                    {added_by: userId},
                    {friend: friendId}
                ]},
                {$and: [
                    {added_by: friendId},
                    {friend: userId}
                ]}
            ]
        };

        const friendship = await Friend.findOne(query_filter3);

        if(expenses.length >= 1) {
            
            let monthWithExpense = null;
            let monthName = "";
            let expensesList = [];
            let counter = 0;

            for(let i = 0; i < expenses.length; i++) {
                let dbDate = new Date(expenses[i].date);
                dbDate = dbDate.toString();
                const splitDate = dbDate.split(' ');

                let myExpense = null;
                let paidBy = "";
                
                // Lent details
                let lentType = "";
                let lentBy = "";
                let lentAmount = 0;

                let lentMember1 = {};
                let lentMember2 = {};

                // Paying members
                let payingMembers = [];
                
                
                if(monthName !== splitDate[1] + " " +  splitDate[3]) {
                    counter += 1;
                    expensesList = [];
                    monthName = splitDate[1] + " " + splitDate[3];
                    monthsList.push(monthName);
                } 

                for(let j = 0 ; j < expenses[i].split_between.length; j++) {
                    if(expenses[i].split_between[j].user._id.equals(userId)) {
                        lentMember1 = expenses[i].split_between[j];
                    } else if(expenses[i].split_between[j].user._id.equals(friendId)) {
                        lentMember2 = expenses[i].split_between[j];
                    }

                    if(expenses[i].split_between[j].paid !== 0) {
                        payingMembers.push(expenses[i].split_between[j]);
                    }
                    
                }
               
                if(lentMember1.paid === expenses[i].amount && lentMember1.paid > lentMember1.share) {
                    lentType = "lent";
                    lentBy = "you lent " + (lentMember2.user.name).split(' ')[0];
                    lentAmount = lentMember2.share;
                } else if(lentMember2.paid === expenses[i].amount && lentMember2.paid > lentMember2.share) {
                    lentType = "borrowed";
                    lentBy = (lentMember2.user.name).split(' ')[0] + " lent you";
                    lentAmount = lentMember1.share;
                } else if(lentMember1.paid !== expenses[i].amount && lentMember1.paid === lentMember1.share) {
                    lentType = "nothing";
                    lentBy = "you borrowed nothing";
                    lentAmount = 0;
                } else if(lentMember1.paid !== expenses[i].amount && lentMember1.paid > lentMember1.share){
                    if(lentMember2.paid < lentMember2.share) {
                        lentType = "lent";
                        lentBy = "you lent " + (lentMember2.user.name).split(' ')[0];
                        lentAmount = (lentMember2.share - lentMember2.paid);
                    }
                } else if (lentMember2.paid !== expenses[i].amount && lentMember2.paid > lentMember2.share) {
                    if(lentMember1.paid < lentMember1.share) {
                        lentType = "borrowed";
                        lentBy = (lentMember2.user.name).split(' ')[0] + " lent you";
                        lentAmount = (lentMember1.share - lentMember1.paid);
                    }
                } else if (lentMember1.paid !== expenses[i].amount && lentMember1.paid < lentMember1.share) {
                    lentType = "nothing";
                    lentBy = "you borrowed nothing";
                    lentAmount = 0;
                }


                if(payingMembers.length === 1) {               
                    if(payingMembers[0].user._id.equals(userId) && payingMembers[0].paid === expenses[i].amount) {
                        paidBy =  "you paid";
                    } else {
                        paidBy = ((payingMembers[0].user.name).split(' ')[0]) + " paid";
                    }
                } else {
                    paidBy = payingMembers.length + " people paid";
                }

                myExpense = {
                    expense: expenses[i],
                    paidBy: paidBy,
                    lentDetails: {
                        type: lentType,
                        message: lentBy,
                        amount: lentAmount
                    }
                };
                
                expensesList.push(myExpense);

                monthWithExpense = {
                    index: counter,
                    monthName: monthName,
                    expenseList: expensesList
                };

                expenseList.splice((counter - 1), 1);
                
                expenseList.push(monthWithExpense);
            };
        }
        return res.status(200).json({
            message: "Friend details",
            result: {
                details: friendDetails,
                expenseList: expenseList,
                settlements: settlement,
                friendship: friendship
            }
        });
    }
});

// API to send OTP to reset password
exports.sendOTP = asyncMiddleware(async(req, res) => {
    const value = req.params.email;
    const user = await User.findOne({ email: value });
    if (user == null) {
        return res.status(404).send({ error: "User not found with given email !" });
    } else {
        const hasOTP = await OTP.findOne({user: user._id});
        if(hasOTP) {
            await OTP.deleteOne({user: user._id});
        }
        // Generate OTP on request
        const otp = otpGenerator.generate(6, {digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false});
        const salt = await bcrypt.genSalt(10);
        const encryptOTP = await bcrypt.hash(otp.toString(), salt);
        const newOTP = new OTP({user: user._id, otp: encryptOTP});
        const otpgenerated = await newOTP.save();

        if(otpgenerated) {
            // Mail Subject
            const mailSubject = "OTP For Password Reset";
            // Mail Body
            const mailBody = `
            <div class="container" style="max-width: 90%; margin: auto; padding-top: 20px">
                <h2>Dear ${user.name},</h2>
                <h4>Here is your One-Time Password(OTP) </h4>
                <p style="margin-bottom: 30px;">Please enter this OTP <strong>${otp}</strong> to reset your password. Valid for One-time use 10 minutes only.</p>
                --
                <p style = "color: #11cc04; font-size: 14px; margin-top: 2px;">Regards,<br>Splitwise Team</p>
            </div>
        `;
            // Call email function to send OTP
            const sendEmail = await email(user.email, mailSubject, mailBody); 
            if(!sendEmail) {
                return res.status(500).send({ error: "Unable to send OTP, please try again!"});
            } else {
                return res.status(200).send({ message: "OTP sent to email, please verify it to change your password!"});
            }
        } else {
            return res.status(500).send({ error: "Unable to send OTP, please try again!"});
        }
    }
});

// API to verify OTP to reset password
exports.verifyOTP = asyncMiddleware(async(req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email });
    if (user == null) {
        return res.status(404).send({ error: "User not found with given email!" });
    } else {
        const findOTP = await OTP.findOne({ user: user._id });
        if(findOTP == null) {
            return res.status(404).send({ error: "OTP not generated for given user!" });
        } else {
            const diffMinute = await fun.calcTimeDiffMin(findOTP.date);
            // console.log(diffMinute);
            if(diffMinute > 10) {
                await OTP.deleteOne({ user: user._id }); // Will delete the otp if it is expired
                return res.status(401).send({ error: "OTP expired!" });
            } else {
                const validatedOTP = await bcrypt.compare(otp.toString(), findOTP.otp);
                if(validatedOTP) {
                    await OTP.deleteOne({ user: user._id }); // Will delete the otp once successfully validated
                    return res.status(200).send({ message: "OTP successfully validated!"});
                } else {
                    // If entered otp is invalid
                    return res.status(401).send({ error: "Invalid OTP!" });
                }
            }    
        }
    }
});

// API to update password
exports.updatePass = asyncMiddleware(async(req, res) => {
    const { email, newPass, confirmPass } = req.body;
    const user = await User.findOne({ email: email });
    if (user == null) {
        return res.status(404).send({ error: "User not found with given email!" });
    } else {
        const salt = await bcrypt.genSalt(10);
        const encryptPass = await bcrypt.hash(newPass, salt);
        // Update password into database
        const updatePass = await User.findOneAndUpdate({email: email }, {
            $set: {
                password: encryptPass
            }
        });
        if(updatePass) {
            return res.status(200).send({ message: "Password succefully updated!" });
        } else {
            return res.status(401).send({ error: "Unable to update password. Please try again!" });
        }
    }
});

// API to change password
exports.changePass = asyncMiddleware(async(req, res) => {
    const userId = req.user; // Passed from middleware after verifying token
    const body = {...req.body};
    const user = await User.findOne({ _id: userId });
    if (user == null) {
        return res.status(404).send({ error: "User not found with given email!" });
    } else {
        //Validate Password
        const validatePass =  await bcrypt.compare(body.oldPass, user.password);
        if(!validatePass) {
            return res.status(401).send({ error: "Incorrect Old Password!" });
        } else {
          
            // Encrypt new password
            const salt = await bcrypt.genSalt(10);
            const encryptPass = await bcrypt.hash(body.newPass, salt);
            // Update password into database
            const updatePass = await User.findOneAndUpdate({ _id: userDetails.id }, {
                $set: {
                    password: encryptPass
                }
            });
            if(updatePass) {
                return res.status(200).send({ message: "Password succefully updated!" });
            } else {
                return res.status(401).send({ error: "Unable to update password. Please try again!" });
            }
        }
    }
});

// API to add friend to list
exports.addFriend = asyncMiddleware(async(req, res) => {
    const userId = req.user; // Passed from middleware after verifying token
    const body = {...req.body};
    let friends = []; // This array will store those users who exists into database
    let notFoundFriends = []; // This array will store those users who does not exist on database

    // This loop will filter existing and non existing users
    for(let i = 0; i < body.friends.length; i++) {
        const user = await User.findOne({email: body.friends[i]}).select('email');

        if(user) {
            if(user._id.equals(userId)){
                continue;
            }
            friends.push(user._id);
        } else {
            notFoundFriends.push(body.friends[i]);
        }
    }

    // Filtering out both arrays for duplicates
    friends = await fun.removeDuplicates(friends, "object");
    notFoundFriends = await fun.removeDuplicates(notFoundFriends, "string");

    if(friends.length < 1) {
        // Send response if none of the entered members are registered. This list can be later used to send invite email to users
        return res.status(404).json({
            error: 'None of your entered friends are registered with us! Invite them to Splitwise!',
            notFoundFriends: notFoundFriends
        });
    } else {
        let flag = false;
        for(let i = 0 ; i < friends.length; i++) {
            // Query filter to search for existing mapping between both users
            const query_filter = {
                $or: [
                    {$and: [
                        {added_by: userId},
                        {friend: friends[i]}
                    ]},
                    {$and: [
                        {added_by: friends[i]},
                        {friend: userId}
                    ]}
                ]
            };

            const ExistingFriends = await Friend.findOne(query_filter);
            if(ExistingFriends) {
                continue;
            } else {
                const newFriend = {
                    added_by: userId,
                    friend: friends[i]
                };

                const createnewFriend = new Friend(newFriend);
                const addNewFriend = await createnewFriend.save();
                if(!addNewFriend) {
                    flag = true;
                    break;
                }
            }
        }

        if(flag) {
            return res.status(500).send({error: 'Internal server error!'});
        } else {
            return res.status(200).json({ 
                message: "Friends added!",
                notFoundFriends: notFoundFriends
            });
        }
    }
});

// API to get friends list
exports.getFriends = asyncMiddleware(async(req, res) => {
    const userId = req.user; // Passed from middleware after verifying token
    let myFriends = [];
    const query_filter = {
        $or: [
            {added_by: userId},
            {friend: userId}
        ]
    };
    const friends = await Friend.find(query_filter).populate('added_by friend', 'name email');

    let totalBalance = 0;
    let totalOwe = 0;
    let totalOwed = 0;
    
    for(let i = 0; i < friends.length; i++) {
        if((friends[i].added_by._id).equals(userId)){
            totalOwe += friends[i].balances.owe;
            totalOwed += friends[i].balances.owed;
            myFriends.push({
                friend: friends[i].friend,
                balances: friends[i].balances
            });
        } else if( (friends[i].friend._id).equals(userId)) {
            totalOwe += friends[i].balances.owed;
            totalOwed += friends[i].balances.owe;
            myFriends.push({
                friend: friends[i].added_by,
                balances: {
                    owe: friends[i].balances.owed,
                    owed: friends[i].balances.owe
                }
            });
        }
    }

    totalBalance = totalOwed - totalOwe;

    if(myFriends.length < 1) {
        return res.status(404).send({error: "No friends found associated with you!"});
    } else {
        let myNewFriends = myFriends.sort(function(a, b){
            let x = a.friend.name.toLowerCase();
            let y = b.friend.name.toLowerCase();
            if (x < y) {return -1;}
            if (x > y) {return 1;}
            return 0;
          });
        return res.status(200).json({
            message: "Your Friends!",
            result: {
                friends: myNewFriends,
                finalBalance: {
                    total: totalBalance,
                    owe: totalOwe,
                    owed: totalOwed
                }
            }
        });
    }

});

// API to invite friends
exports.inviteFriends = asyncMiddleware(async(req, res) => {
    const userId = req.user;
    const {invitedUsers} = req.body;
    const user = await User.findOne({_id: userId});
    if(!user) {
        return res.status(500).send({error: "Internal server error!"});
    }
    let flag = false;
    for(let i = 0; i < invitedUsers.length; i++) {

        // Mail Subject
        const mailSubject = "Invitation to join Splitwise";
        // Mail Body
        const mailBody = `
            <div class="container" style="max-width: 90%; margin: auto; padding-top: 20px">
                <h2>Dear User,</h2>
                <h4>${user.name} has invited you to join splitwise. </h4>
                <p style="margin-bottom: 30px;">Click on the below given button to join now.</p>
                <p style='text-align:center;'><a href='http://${ip.address()}:3000/signup' style='font-size: 1rem; font-weight: 600; padding: 12px 20px;  text-decoration: none; cursor: pointer; background-color: #fe6d3c; color: #FFFFFF; border: 0; border-radius: 5px;'>Join Now!</a></p>
                
                <div class="signature" style='margin-top:5px;'>
                    --
                    <p style = "color: #11cc04; font-size: 14px; margin-top: 2px;">Regards,<br>Splitwise Team</p>
                </div>
            </div>
        `;

        // Call email function to invite friends
        const sendEmail = await email(invitedUsers[i], mailSubject, mailBody); 
        if(!sendEmail) {
            flag = true;
        }
    }

    if(!flag) {
        res.status(200).send({ message: "Sent invitation to your friends!"});
    } else {
        res.status(500).send({ error: "Unable to invite your friends, please try again!"});
    }
});

// API to send balance reminder
exports.sendReminder = asyncMiddleware(async(req, res) => {
    const userId = req.user; // Passed after verifying token
    const {friendId} = req.params; // Taking it out from params

    let remindingUser = "";
    let remindedUser = "";
    let remindedUserEmail = "";
    let reminderAmount = 0;

    // const user = await User.findOne({_id: userId}).select('-password');
    // const friend = await User.findOne({_id: friendId}).select('-password');
    const query_filter = {
        $or: [
            {$and: [
                {added_by: userId},
                {friend: friendId}
            ]},
            {$and: [
                {added_by: friendId},
                {friend: userId}
            ]}
        ]
    };

    const friendship = await Friend.findOne(query_filter).populate('added_by friend', 'name email');

    if(friendship) {
        if(friendship.added_by._id.equals(userId)) {
            remindingUser = friendship.added_by.name;
            remindedUser = friendship.friend.name;
            remindedUserEmail = friendship.friend.email;
            reminderAmount = friendship.balances.owed;
        } else {
            remindingUser = friendship.friend.name;
            remindedUser = friendship.added_by.name;
            remindedUserEmail = friendship.added_by.email;
            reminderAmount = friendship.balances.owe;
        }

        if(reminderAmount > 0) {

            // Mail Subject
            const mailSubject = "Due Balance Reminder";
            // Mail Body
            const mailBody = `
            <div class="container" style="max-width: 90%; margin: auto; padding-top: 20px">
                <h2>Dear ${remindedUser},</h2>
                <h4>You have an outstanding amount of <strong> ₹${reminderAmount} </strong> payable to <strong> ${remindingUser} </strong></h4>
                <p style="margin-bottom: 30px;">Kindly, pay the outstanding amount and settle your account with ${remindingUser} now.</p>
                --
                <p style = "color: #11cc04; font-size: 14px; margin-top: 2px;">Regards,<br>Splitwise Team</p>
            </div>
            `;
            // Call email function to send reminder
            const sendEmail = await email(remindedUserEmail, mailSubject, mailBody); 
            if(!sendEmail) {
                return res.status(500).send({ error: "Unable to send reminder, please try again!"});
            } else {
                return res.status(200).send({ message: "Reminder sent!"});
            }
        } else {
            return res.status(401).send({ error: `${remindedUser} does not owe any balance to you!`});
        }

    }
});