const express = require('express');
const router = express.Router();
// Controllers
const UserController = require('../Controllers/userController');
// Schema Validations
const { emailSchema, userSchema, userLoginSchema, changePassSchema, updatePassSchema, friendsSchema } = require('../middlewares/schema/user-schema');
const { otpSchema } = require('../middlewares/schema/otp-schema');
// Schema Validation Errors
const validateData = require('../middlewares/validator');
// Authentication middleware
const userAuth = require('../middlewares/auth');

// ROUTE 1:: Signup User: Using POST '/user'. (No Login required)
router.post('/',[ userSchema, validateData], UserController.createUser);

//ROUTE 2:: Login User: Using POST '/user/login'. (No Login required)
router.post('/login', [userLoginSchema, validateData], UserController.loginUser );

//ROUTE 3.1:: Reset Password :Using POST '/user/sendOTP/:email'. (No Login required)
router.post('/sendOTP/:email', [emailSchema, validateData], UserController.sendOTP);
//ROUTE 3.2:: Reset Password :Using POST '/user/verifyOTP'. (No Login required)
router.post('/verifyOTP', [otpSchema, validateData], UserController.verifyOTP);
//ROUTE 3.3:: Reset Password :Using POST '/user/updatePass'. (No Login required)
router.post('/updatePass', [updatePassSchema, validateData], UserController.updatePass);

//ROUTE 4:: Get user details: Using GET '/user'. (Login required)
router.get('/', userAuth, UserController.getUser);

//ROUTE 5:: Get friend details: Using GET '/user/:id'. (Login required)
router.get('/friendDetails/:id', userAuth, UserController.getFriendDetails);

//ROUTE 6:: Change Password: Using PUT '/user/changePass'. (Login required)
router.put('/changePass', [changePassSchema, validateData, userAuth], UserController.changePass);

// ROUTE 7:: Add Friend: Using POST '/user/addFriend'. (Login required)
router.post('/addFriend', [friendsSchema, validateData, userAuth], UserController.addFriend);

// ROUTE 8:: Get Friend: Using GET '/user/friends'. (Login required)
router.get('/friends', userAuth, UserController.getFriends);

// ROUTE 9:: Invite Friends: Using POST '/user/friends/invite'. (Login required)
router.post('/friends/invite', userAuth, UserController.inviteFriends);

// ROUTE 10:: Send Reminder: Using GET 'user/remind/:friendId'. (Login required)
router.get('/remind/:friendId', userAuth, UserController.sendReminder);

module.exports  = router;