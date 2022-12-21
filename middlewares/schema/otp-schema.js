const {check} = require('express-validator');

const otpSchema = [
    check('email')
    .exists({ checkFalsy: true})
    .withMessage("Email address can't be blank")
    .bail()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
    check('otp')
    .exists({ checkFalsy: true})
    .withMessage('Please enter your one-time password!')
    .bail()
    .isLength({min: 6, max:6})
    .withMessage('OTP should be of minimum 6 characters')
];

module.exports = {
    otpSchema
};