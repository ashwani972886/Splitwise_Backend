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

//ROUTE 5:: Change Password: Using PUT '/user/changePass'. (Login required)
router.put('/changePass', [changePassSchema, validateData, userAuth], UserController.changePass);

// ROUTE 6:: Add Friend: Using PUT '/user/addFriend'. (Login required)
router.put('/addFriend', [friendsSchema, validateData, userAuth], UserController.addFriend);

// ROUTE 7:: Get Friend: Using GET '/user/friends'. (Login required)
router.get('/friends', userAuth, UserController.getFriends);

module.exports  = router;