const {check} = require('express-validator');

const expenseSchema = [
    check('type', 'Please select valid expense type')
    .isIn(['Group', 'Friend']),
    check('desc', "Please enter expense description")
    .exists({ checkFalsy: true}),
    check('amount', 'Please enter expense amount')
    .exists({ checkFalsy: true}),
    check('category', 'Please enter expense category')
    .exists({ checkFalsy: true}),
    check('split_method', 'Please enter a valid split method')
    .exists({ checkFalsy: true})
    .bail()
    .isIn(['equally', 'amounts', 'percentages', 'shares']),    
];

module.exports = {
    expenseSchema
};