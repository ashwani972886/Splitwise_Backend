// Functions
const fun = require('../init/function');
const email = require('../init/sendEmail');
// Packages required

// Secrets from .env

// Try-catch middleware
const asyncMiddleware = require('../middlewares/async');

// Models
const User = require('../models/user');
const Group = require('../models/groups');
const Friend = require('../models/friends');

exports.createGroup = asyncMiddleware(async(req, res) => {
    const body = {...req.body};
    body.admin = req.user; //Assigning the id of group admin
    body.groupName = fun.Capitalize(body.groupName); // To capitalize each word of group name
    const query_filter = {
        $and: [
            {groupName: body.groupName},
            {
                $or: [
                    {admin: body.admin},
                    {"members": body.admin}
                ]

            }
        ]
    };
    const groupWithSameName = await Group.findOne(query_filter);
    if(groupWithSameName) {
        return res.status(401).send({error: "You have already created this group, please choose a different name!"});
    }
    let members = [];
    let notFoundMembers = [];
    for(let i= 0; i < body.members.length; i++) {
        const user = await User.findOne({ email: body.members[i] });
        if(user){
            members.push(user._id);
        } else {
            notFoundMembers.push(body.members[i]);
        }
    }

    members = await fun.removeDuplicates(members, "object");
    notFoundMembers = await fun.removeDuplicates(notFoundMembers, "string");

    if(notFoundMembers.length > 0 || members.length < 1) {
        return res.status(404).json({ 
            error: 'Some users are not registered with us! Invite them to Splitwise, then try adding them to group!',
            members: notFoundMembers
        });
    } else {
        body.members = members;
        const newGroup = new Group(body);
        const newGroupSaved = await newGroup.save();
        if(!newGroupSaved) {
                return res.status(401).send({error: "Unable to create group due to some technical error! Please try again!"});
        } else {
            let flag = false;
            for(let i = 0 ; i < members.length; i++) {
                // Query filter to search for existing mapping between both users
                const query_filter1 = {
                    $or: [
                        {$and: [
                            {added_by: body.admin},
                            {friend: members[i]}
                        ]},
                        {$and: [
                            {added_by: members[i]},
                            {friend: body.admin}
                        ]}
                    ]
                };

                const ExistingFriends = await Friend.findOne(query_filter1);
                if(ExistingFriends) {
                    continue;
                } else {
                    const newFriend = {
                        added_by: body.admin,
                        friend: members[i]
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
                return res.status(200).send({message: 'Group created successfully'});
            }
        }

        
    }
});

exports.getGroupList = asyncMiddleware(async(req, res) => {
    const userId = req.user; // Passed after verifying token

    // Query filter to search only groups associated with user
    const query_filter = {
        $or: [
            {"admin": userId},
            {"members": userId}
        ]
    };

    // Running the query to find groups associated with user
    const groups = await Group.find(query_filter).populate('members', 'name email');
    
    // Response after query
    if(groups.length < 1) {
        return res.status(404).send({error: "No groups found associated with you!"});
    } else {
        return res.status(200).json({
            message: "Group List fetched successfully!",
            result: groups
        });
    }
});

// exports.extrasinAddGroup = () => {
// const admin = await User.findOne({_id: body.admin}).select('friends');

            // let finalFriendsList = admin.friends; // This array stores the previously stored friends
            // let newlyAddedFriends = []; // This array will store friends which are newly added after filtering

            // for(let i = 0; i < members.length; i++) {
            //     const member = {
            //         _id: members[i],
            //         balances: {
            //             owe: 0,
            //             owed: 0
            //         }
            //     };
            //     let finalListLength = finalFriendsList.length; // Length of previously stored friends list to check if new members are added
            //     finalFriendsList = await fun.checkAlreadyExistsInArray(finalFriendsList, member); // Adding a new friend to list if it does not exist previously
            //     let newFinalListLength = finalFriendsList.length; // New length after modifying list to compare
            //     if(newFinalListLength > finalListLength) {
            //         newlyAddedFriends.push(member);
            //     }
            // }

            // // Update the users list with new friends
            // const updatedFriends = await User.findOneAndUpdate({_id: body.admin}, {
            //     $set: {
            //         friends: finalFriendsList
            //     }
            // });

            // if(!updatedFriends) {
            //     return res.status(500).send({error: 'Internal server error!'});
            // } else {
            //     let flag = false;
            //     for(let i = 0; i < newlyAddedFriends.length; i++) {
            //         // User object that has to be stored in each friends list into database
            //         const userAsNewFriend = {
            //             _id: body.admin,
            //             balances: {
            //                 owe: 0,
            //                 owed: 0
            //             }
            //         };
            //         // Updating each friends list one by one
            //         const updateRestUsers = await User.findOneAndUpdate({_id: newlyAddedFriends[i]._id}, {
            //             $push: { friends: userAsNewFriend}
            //         });
    
            //         if(!updateRestUsers) {
            //             flag = true;
            //             break;
            //         }
            //     }
            //     if(flag) {
            //         return res.status(500).send({error: 'Internal server error!'});
            //     } else {
            //         return res.status(200).send({message: 'Group created successfully'});
            //     }
            // }
            // .then(group => {
        //     return res.status(201).json({
        //         message: "New group created successfully!",
        //         result: group
        //     });
        // })
        // .catch(err => {
        // });
// };