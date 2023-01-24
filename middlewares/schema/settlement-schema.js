const {check} = require('express-validator');

const settlementSchema = [
    check('settleWithin')
    .exists({ checkFalsy: true })
    .isIn(["Individual", "Group"]),
    check('amount')
    .exists({ checkFalsy: true})
    .withMessage("Please enter the settlement amount."),
    check('payee')
    .exists({ checkFalsy: true})
    .withMessage('Please select a valid user for who paid the amount.'),
    check('receiver')
    .exists({ checkFalsy: true})
    .withMessage('Please select a valid user to whom the amount is paid.')    
];

module.exports = {
    settlementSchema
};