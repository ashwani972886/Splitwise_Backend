const {check, param} = require('express-validator');

const emailSchema = [
    param('email')
    .exists({ checkFalsy: true})
    .withMessage("Email address can't be blank")
    .bail()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
];

const userSchema = [
    check('name', "Name can't be blank")
    .exists({ checkFalsy: true}),
    check('email')
    .exists({ checkFalsy: true})
    .withMessage("Email address can't be blank")
    .bail()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
    check('phone', 'Please enter a valid phone number!')
    .isLength({max:10}),
    check('password', 'Password is too short (minimum is 8 characters)')
    .exists({ checkFalsy: true})
    .bail()
    .isLength({min: 8})
];

const userLoginSchema = [
    check('email')
    .exists({ checkFalsy: true})
    .withMessage("Email address can't be blank")
    .bail()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
    check('password', 'Password is too short (minimum is 8 characters)')
    .exists({ checkFalsy: true})
    .bail()
    .isLength({min: 8})
];

const changePassSchema = [
    check('oldPass', 'Please enter valid old password!')
    .exists({ checkFalsy: true})
    .bail(),
    check('newPass', 'New password is too short (minimum is 8 characters)')
    .exists({ checkFalsy: true})
    .bail()
    .isLength({min: 8}),
    check('confirmPass', 'Confirm password is too short (minimum is 8 characters)')
    .exists({ checkFalsy: true})
    .bail()
    .isLength({min: 8})
    .bail()
    .custom((value, { req }) => {
        if(value !== req.body.newPass) {
            throw new Error('New password & confirm password do not match!')
        }
        return true;
    })
];

const updatePassSchema = [  
    check('email')
    .exists({ checkFalsy: true})
    .withMessage("Email address can't be blank")
    .bail()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
    check('newPass', 'New password is too short (minimum is 8 characters)')
    .exists({ checkFalsy: true})
    .bail()
    .isLength({min: 8}),
    check('confirmPass', 'Confirm password is too short (minimum is 8 characters)')
    .exists({ checkFalsy: true})
    .bail()
    .isLength({min: 8})
    .bail()
    .custom((value, { req }) => {
        if(value !== req.body.newPass) {
            throw new Error('New password & confirm password do not match!')
        }
        return true;
    })
];

const friendsSchema = [
    check('friends')
    .exists({ checkFalsy: true})
    .withMessage( 'Please enter atleast 1 email to add friends')
    .bail()
    .isArray({min:1})
    .withMessage("Please pass your friend's email"),
    check('friends.*')
    .exists({checkFalsy: true})
    .isEmail()
    .withMessage('Please pass valid email of users to add as a friend')
    .normalizeEmail()
];

module.exports = {
    emailSchema, userSchema, userLoginSchema, changePassSchema, updatePassSchema, friendsSchema
};