// Functions
const fun = require('../init/function');
const email = require('../init/sendEmail');
// Packages required
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
// Secrets from .env
const jwt_secret = process.env.JWT_SECRET;

// Try-catch middleware
const asyncMiddleware = require('../middlewares/async');

// Models
const User = require('../models/user');
const OTP = require('../models/otp');
const Friend = require('../models/friends');

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
                res.status(500).send({ error: "Unable to send OTP, please try again!"});
            } else {
                res.status(200).send({ message: "OTP sent to email, please verify it to change your password!"});
            }
        } else {
            res.status(500).send({ error: "Unable to send OTP, please try again!"});
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
// exports.addFriend = asyncMiddleware(async(req, res) => {
//     const userId = req.user; // Passed from middleware after verifying token
//     const body = {...req.body};
//     let friends = []; // This array will store those users who exists into database
//     let notFoundFriends = []; // This array will store those users who does not exist on database

//     // This loop will filter existing and non existing users
//     for(let i = 0; i < body.friends.length; i++) {
//         const user = await User.findOne({email: body.friends[i]}).select('email');

//         if(user) {
//             if(user._id.equals(userId)){
//                 continue;
//             }
//             // Object that has to be stored into database
//             const id = {
//                 _id: user._id,
//                 balances: {
//                     owe: 0,
//                     owed: 0
//                 }
//             };
//             friends = await fun.checkAlreadyExistsInArray(friends, id);
//         } else {
//             notFoundFriends.push(body.friends[i]);
//             notFoundFriends = [...new Set(notFoundFriends)];
//         }
//     }

//     if(friends.length < 1) {
//         // Send response if none of the entered members are registered. This list can be later used to send invite email to users
//         return res.status(404).json({
//             message: 'None of your entered friends are registered with us! Invite them to Splitwise!',
//             result: notFoundFriends
//         });
//     } else {
//         // Finding users existing friends to update the newly added friends
//         const user = await User.findOne({_id: userId}).select('friends');
//         let finalFriendsList = user.friends; // This array stores the previously stored friends
//         let newlyAddedFriends = []; // This array will store friends which are newly added after filtering

//         for(let i = 0; i < friends.length; i++) {
//             let finalListLength = finalFriendsList.length; // Length of previously stored friends list to check if new members are added
//             finalFriendsList = await fun.checkAlreadyExistsInArray(finalFriendsList, friends[i]); // Adding a new friend to list if it does not exist previously
//             let newFinalListLength = finalFriendsList.length; // New length after modifying list to compare
//             if(newFinalListLength > finalListLength) {
//                 newlyAddedFriends.push(friends[i]);
//             }
//         }
        
//         // Update the users list with new friends
//         const updatedFriends = await User.findOneAndUpdate({_id: userId}, {
//             $set: {
//                 friends: finalFriendsList
//             }
//         });

//         if(!updatedFriends) {
//             return res.status(500).send({error: 'Internal server error!'});
//         } else {
//             let flag = false;
//             for(let i = 0; i < newlyAddedFriends.length; i++) {
//                 // User object that has to be stored in each friends list into database
//                 const userAsNewFriend = {
//                     _id: userId,
//                     balances: {
//                         owe: 0,
//                         owed: 0
//                     }
//                 };
//                 // Updating each friends list one by one
//                 const updateRestUsers = await User.findOneAndUpdate({_id: newlyAddedFriends[i]._id}, {
//                     $push: { friends: userAsNewFriend}
//                 });

//                 if(!updateRestUsers) {
//                     flag = true;
//                     break;
//                 }
//             }
//             if(flag) {
//                 return res.status(500).send({error: 'Internal server error!'});
//             } else {
                
//                 return res.status(200).send({message: 'Added friends successfully!'});
//             }
//         }
//     }
// });

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
            message: 'None of your entered friends are registered with us! Invite them to Splitwise!',
            result: notFoundFriends
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
            return res.status(200).send({ message: "All of your friends are added!" });
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
    
    for(let i = 0; i < friends.length; i++) {
        if((friends[i].added_by._id).equals(userId)){
            myFriends.push({
                friend: friends[i].friend,
                balances: friends[i].balances
            });
        } else if( (friends[i].friend._id).equals(userId)) {
            myFriends.push({
                friend: friends[i].added_by,
                balances: friends[i].balances
            });
        }
    }

    if(myFriends.length < 1) {
        return res.status(404).send({error: "No friends found associated with you!"});
    } else {
        return res.status(200).json({
            message: "Your Friends!",
            result: myFriends
        });
    }

});

